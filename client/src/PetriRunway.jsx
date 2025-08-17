import React, { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";

/**
 * PetriRunway.jsx
 *
 * Composant principal de l'interface RDP + visualisation Cytoscape.
 *
 * Pré-requis backend (Flask) :
 *  - GET  /net      -> retourne { places: [...], transitions: [...], pre: {...}, post: {...} }
 *  - GET  /marking  -> retourne le marquage { placeName: count, ... }
 *  - POST /add      -> { place: "...", count: n }
 *  - POST /fire     -> { transition: "..." }
 *  - POST /step     -> applique la politique
 *  - POST /reset    -> reset
 *
 * Notes :
 *  - Ce composant gère son propre polling léger pour rester synchronisé avec le backend.
 *  - L'animation des jetons est basique : on crée des petits nodes temporaires (« token_... »),
 *    on les positionne sur la place source, on les anime vers la place cible, puis on les supprime.
 */

const API = "http://localhost:5000"; // adapte si nécessaire

export default function PetriRunway() {
  const [net, setNet] = useState(null);
  const [marking, setMarking] = useState({});
  const [prevMarking, setPrevMarking] = useState(null);
  const [lastFired, setLastFired] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [autoRunning, setAutoRunning] = useState(false); // <-- nouvel état pour Step en boucle

  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const loopRef = useRef(null); // <-- stocke l'interval pour auto-run

  // Chargement initial du net + marquage
  const loadNetAndMarking = async () => {
    try {
      const [nRes, mRes] = await Promise.all([
        fetch(`${API}/net`).then((r) => r.json()),
        fetch(`${API}/marking`).then((r) => r.json()),
      ]);
      setNet(nRes);
      setMarking(mRes);
      setPrevMarking(mRes);
    } catch (e) {
      setErr("Impossible de joindre le backend (net/marking).");
    }
  };

  useEffect(() => {
    loadNetAndMarking();
    // petit poll pour rester synchro (optionnel)
    const interval = setInterval(async () => {
      try {
        const m = await fetch(`${API}/marking`).then((r) => r.json());
        setPrevMarking((p) => p ?? m);
        setMarking(m);
      } catch {
        // ignore silencieusement
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialisation de Cytoscape quand net est prêt
  useEffect(() => {
    if (!net || !containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements = [];

    net.places.forEach((p) => {
      elements.push({
        data: { id: p, label: `${p} (${marking?.[p] ?? 0})`, type: "place" },
        classes: "place",
      });
    });

    net.transitions.forEach((t) => {
      elements.push({
        data: { id: t, label: t, type: "transition" },
        classes: "transition",
      });
    });

    Object.entries(net.pre || {}).forEach(([t, places]) => {
      Object.keys(places).forEach((p, idx) => {
        elements.push({
          data: { id: `e_pre_${p}_${t}_${idx}`, source: p, target: t },
        });
      });
    });

    Object.entries(net.post || {}).forEach(([t, places]) => {
      Object.keys(places).forEach((p, idx) => {
        elements.push({
          data: { id: `e_post_${t}_${p}_${idx}`, source: t, target: p },
        });
      });
    });

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: ".place",
          style: {
            shape: "ellipse",
            width: 60,
            height: 60,
            "background-color": "#2563eb",
            "text-valign": "center",
            "text-halign": "center",
            color: "#fff",
            label: "data(label)",
            "font-size": 10,
            "overlay-padding": "6px",
          },
        },
        {
          selector: ".transition",
          style: {
            shape: "rectangle",
            width: 40,
            height: 20,
            "background-color": "#10b981",
            "text-valign": "center",
            "text-halign": "center",
            color: "#fff",
            label: "data(label)",
            "font-size": 9,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#9ca3af",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#9ca3af",
            "curve-style": "bezier",
          },
        },
        {
          selector: ".token",
          style: {
            shape: "ellipse",
            width: 10,
            height: 10,
            "background-color": "#ef4444",
            "z-index": 9999,
            label: "",
          },
        },
      ],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 20,
        spacingFactor: 1.8,
      },
    });

    cyRef.current.on("tap", "node.transition", async (evt) => {
      const t = evt.target.id();
      await fireTransition(t);
    });

    const onResize = () => cyRef.current && cyRef.current.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [net]);

  useEffect(() => {
    if (!cyRef.current || !marking) return;
    const cy = cyRef.current;
    Object.keys(marking).forEach((p) => {
      const n = cy.$id(p);
      if (n && n.length > 0) {
        n.data("label", `${p} (${marking[p]})`);
      }
    });
  }, [marking]);

  const fireTransition = async (t) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/fire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transition: t }),
      }).then((r) => r.json());
      if (!res.ok) {
        setErr(res.error || "Transition non activée");
      } else {
        const fired = res.fired ?? t;
        const newMarking = res.marking;
        animateFiring(fired, prevMarking ?? marking, newMarking);
        setPrevMarking(newMarking);
        setMarking(newMarking);
        setLastFired(fired);
      }
    } catch {
      setErr("Erreur réseau lors du fire.");
    }
    setLoading(false);
  };

  const step = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/step`, { method: "POST" }).then((r) =>
        r.json()
      );
      if (!res.ok) {
        setErr(res.error || "Step error");
        stopAutoRun();
      } else {
        const fired = res.fired;
        const newMarking = res.marking;
        if (fired) {
          animateFiring(fired, prevMarking ?? marking, newMarking);
          setLastFired(fired);
        } else {
          if (autoRunning) stopAutoRun();
        }
        setPrevMarking(newMarking);
        setMarking(newMarking);
      }
    } catch {
      setErr("Erreur réseau lors du step.");
      stopAutoRun();
    }
    setLoading(false);
  };

  const startAutoRun = () => {
    if (autoRunning) return;
    setAutoRunning(true);
    loopRef.current = setInterval(step, 800);
  };

  const stopAutoRun = () => {
    setAutoRunning(false);
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  };

  const toggleAutoRun = () => {
    if (autoRunning) {
      stopAutoRun();
    } else {
      startAutoRun();
    }
  };

  const reset = async () => {
    stopAutoRun();
    setLoading(true);
    try {
      const res = await fetch(`${API}/reset`, { method: "POST" }).then((r) =>
        r.json()
      );
      if (res.ok) {
        setPrevMarking(res.marking);
        setMarking(res.marking);
        setLastFired(null);
      } else {
        setErr("Erreur reset");
      }
    } catch {
      setErr("Erreur réseau reset");
    }
    setLoading(false);
  };

  const addTokens = async (place, count = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place, count }),
      }).then((r) => r.json());
      if (res.ok) {
        setPrevMarking(res.marking);
        setMarking(res.marking);
      } else {
        setErr(res.error || "Erreur add");
      }
    } catch {
      setErr("Erreur réseau add");
    }
    setLoading(false);
  };

  const animateFiring = (fired, before, after) => {
    const cy = cyRef.current;
    if (!cy || !net) return;

    const consumed = {};
    const produced = {};
    Object.keys(before || {}).forEach((p) => {
      const b = Number(before[p] ?? 0);
      const a = Number(after?.[p] ?? 0);
      if (b > a) consumed[p] = b - a;
      if (a > b) produced[p] = a - b;
    });

    const prePlaces = Object.keys((net.pre && net.pre[fired]) || {});
    const postPlaces = Object.keys((net.post && net.post[fired]) || {});

    const sources = prePlaces.length ? prePlaces : Object.keys(consumed);
    const targets = postPlaces.length ? postPlaces : Object.keys(produced);

    if (fired) {
      const tNode = cy.$id(fired);
      if (tNode && tNode.length) {
        tNode.animate({ style: { "background-color": "#ef4444" } }, { duration: 250 })
          .animate({ style: { "background-color": "#10b981" } }, { duration: 400 });
      }
    }

    sources.forEach((s) => {
      const howMany = consumed[s] ?? 1;
      for (let i = 0; i < howMany; i++) {
        const sourceNode = cy.$id(s);
        if (!sourceNode || sourceNode.length === 0) continue;
        const targetId =
          targets.length > 0 ? targets[i % targets.length] : targets[0] || s;
        const targetNode = cy.$id(targetId);

        const tokenId = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const startPos = sourceNode.position();
        const endPos = targetNode && targetNode.length ? targetNode.position() : startPos;

        cy.batch(() => {
          cy.add({
            group: "nodes",
            data: { id: tokenId },
            position: { x: startPos.x + (Math.random() - 0.5) * 6, y: startPos.y + (Math.random() - 0.5) * 6 },
            classes: "token",
          });
        });

        const token = cy.$id(tokenId);
        token.animate(
          { position: { x: endPos.x + (Math.random() - 0.5) * 6, y: endPos.y + (Math.random() - 0.5) * 6 } },
          { duration: 700 + Math.floor(Math.random() * 300) }
        );

        setTimeout(() => {
          try {
            token.animate({ style: { opacity: 0 } }, { duration: 200 });
            setTimeout(() => {
              cy.remove(token);
            }, 250);
          } catch {}
        }, 1000 + Math.floor(Math.random() * 300));
      }
    });
  };

  const transitions = useMemo(() => net?.transitions ?? [], [net]);
  const places = useMemo(() => net?.places ?? [], [net]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Réseau de Petri — Piste unique ✈️</h1>
        <div className="flex gap-2">
          <button
            onClick={step}
            disabled={loading || autoRunning}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
          >
            Step
          </button>
          <button
            onClick={toggleAutoRun}
            className={`px-3 py-2 rounded ${autoRunning ? "bg-red-600" : "bg-green-600"} text-white`}
          >
            {autoRunning ? "Stop" : "Step en boucle"}
          </button>
          <button
            onClick={reset}
            disabled={loading}
            className="px-3 py-2 rounded bg-gray-200 disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>

      {err && <div className="p-3 rounded bg-red-100 text-red-800">{err}</div>}
      {lastFired && (
        <div className="p-2 rounded bg-green-100 text-green-800">
          Dernière transition : <b>{lastFired}</b>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="col-span-1 space-y-4">
          <div className="p-4 bg-white shadow rounded">
            <h2 className="font-semibold mb-2">Places</h2>
            <div className="grid gap-2">
              {places.map((p) => (
                <div key={p} className="flex items-center justify-between">
                  <div className="text-sm">{p}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{marking?.[p] ?? 0}</div>
                    {(p === "attente_atterrissage" || p === "attente_décollage") && (
                      <>
                        {[1, 2, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => addTokens(p, n)}
                            className="px-2 py-1 rounded bg-blue-600 text-white text-xs"
                            disabled={loading}
                          >
                            +{n}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white shadow rounded">
            <h2 className="font-semibold mb-2">Transitions</h2>
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <button
                  key={t}
                  onClick={() => fireTransition(t)}
                  disabled={loading}
                  className="px-3 py-2 rounded bg-white border shadow text-sm hover:bg-gray-50"
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Cliquer sur une transition tente de la tirer. / Step applique la politique serveur.
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="p-4 bg-white shadow rounded">
            <div
              ref={containerRef}
              id="cy"
              style={{ width: "100%", height: 520 }}
              className="rounded"
            ></div>
            <p className="text-xs text-gray-500 mt-2">
              Clique sur une transition dans le graphe pour la tirer manuellement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
