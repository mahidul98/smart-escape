import { useState } from "react";
import "./App.css";
import { findShortestRoute } from "./utils/dijkstra";

function App() {
  const [building, setBuilding] = useState(null);
  const [error, setError] = useState(false);
  const [startNode, setStartNode] = useState("");
  const [route, setRoute] = useState(null);
  const [language, setLanguage] = useState("en");

  const [currentState, setCurrentState] = useState({
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: [],
  });

  const text = {
    en: {
      title: "Smart Escape",
      subtitle: "Interactive Evacuation Route Simulator",
      import: "Import Building",
      choose: "Choose building.json",
      welcome:
        "Import a building.json file to visualize the building and calculate evacuation routes.",
      starting: "Starting Location",
      select: "Select starting location",
      emergency: "Emergency Controls",
      corridors: "Blocked Corridors",
      exits: "Closed Exits",
      locations: "Blocked Locations",
      reset: "Reset Emergency State",
      routeFound: "Route found",
      exit: "Exit",
      cost: "Cost",
      noRoute: "No route available",
      blocked: "Starting location blocked",
      importError: "Import Error",
      invalidFile: "Invalid building.json file",
      nodes: "nodes",
      corridorCount: "corridors",
    },

    bn: {
      title: "স্মার্ট এসকেপ",
      subtitle: "ইন্টার‍্যাক্টিভ ইভাকুয়েশন রুট সিমুলেটর",
      import: "বিল্ডিং ইমপোর্ট করুন",
      choose: "building.json নির্বাচন করুন",
      welcome:
        "বিল্ডিং দেখতে এবং নিরাপদ বের হওয়ার পথ নির্ধারণ করতে building.json ফাইল ইমপোর্ট করুন।",
      starting: "শুরুর স্থান",
      select: "শুরুর স্থান নির্বাচন করুন",
      emergency: "জরুরি নিয়ন্ত্রণ",
      corridors: "বন্ধ করিডোর",
      exits: "বন্ধ এক্সিট",
      locations: "বন্ধ স্থান",
      reset: "জরুরি অবস্থা রিসেট করুন",
      routeFound: "রুট পাওয়া গেছে",
      exit: "এক্সিট",
      cost: "খরচ",
      noRoute: "কোনো রুট পাওয়া যায়নি",
      blocked: "শুরুর স্থানটি বন্ধ",
      importError: "ইমপোর্টে সমস্যা",
      invalidFile: "ভুল building.json ফাইল",
      nodes: "নোড",
      corridorCount: "করিডোর",
    },
  };

  const t = text[language];

  function handleFileImport(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (
          !data.building ||
          !Array.isArray(data.nodes) ||
          !Array.isArray(data.edges)
        ) {
          throw new Error("Invalid building.json format");
        }

        setBuilding(data);
        setStartNode("");
        setRoute(null);
        setError(false);

        setCurrentState({
          blocked_nodes: data.initial_state?.blocked_nodes || [],
          blocked_edges: data.initial_state?.blocked_edges || [],
          closed_exits: data.initial_state?.closed_exits || [],
        });
      } catch (err) {
        setBuilding(null);
        setRoute(null);
        setError(true);
      }
    };

    reader.readAsText(file);
  }

  function calculateRoute(start, state) {
    if (!building || !start) {
      setRoute(null);
      return;
    }

    const result = findShortestRoute(
      building.nodes,
      building.edges,
      start,
      state
    );

    setRoute(result);
  }

  function handleStartChange(event) {
    const selectedStart = event.target.value;

    setStartNode(selectedStart);

    calculateRoute(selectedStart, currentState);
  }

  function updateState(newState) {
    setCurrentState(newState);

    if (startNode) {
      calculateRoute(startNode, newState);
    }
  }

  function toggleEdge(edgeId) {
    const isBlocked = currentState.blocked_edges.includes(edgeId);

    const newState = {
      ...currentState,

      blocked_edges: isBlocked
        ? currentState.blocked_edges.filter(
            (id) => id !== edgeId
          )
        : [...currentState.blocked_edges, edgeId],
    };

    updateState(newState);
  }

  function toggleExit(exitId) {
    const isClosed = currentState.closed_exits.includes(exitId);

    const newState = {
      ...currentState,

      closed_exits: isClosed
        ? currentState.closed_exits.filter(
            (id) => id !== exitId
          )
        : [...currentState.closed_exits, exitId],
    };

    updateState(newState);
  }

  function toggleNode(nodeId) {
    const isBlocked = currentState.blocked_nodes.includes(nodeId);

    const newState = {
      ...currentState,

      blocked_nodes: isBlocked
        ? currentState.blocked_nodes.filter(
            (id) => id !== nodeId
          )
        : [...currentState.blocked_nodes, nodeId],
    };

    updateState(newState);
  }

  function resetEmergencyState() {
    const resetState = {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: [],
    };

    setCurrentState(resetState);

    if (startNode) {
      calculateRoute(startNode, resetState);
    } else {
      setRoute(null);
    }
  }

  function isRouteEdge(edge) {
    if (!route || route.status !== "success") {
      return false;
    }

    if (!route.path || route.path.length < 2) {
      return false;
    }

    for (let i = 0; i < route.path.length - 1; i++) {
      const a = route.path[i];
      const b = route.path[i + 1];

      if (
        (edge.from === a && edge.to === b) ||
        (edge.from === b && edge.to === a)
      ) {
        return true;
      }
    }

    return false;
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="header-buttons">

          <button
            className="language-button"
            onClick={() =>
              setLanguage(language === "en" ? "bn" : "en")
            }
          >
            {language === "en" ? "বাংলা" : "English"}
          </button>

          <label className="import-button">
            {t.import}

            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              hidden
            />
          </label>

        </div>

      </header>


      {/* MAIN */}
      <main className="main">

        {/* WELCOME */}
        {!building && !error && (
          <section className="welcome">

            <h2>{t.title}</h2>

            <p>{t.welcome}</p>

            <label className="big-import-button">
              {t.choose}

              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                hidden
              />
            </label>

          </section>
        )}


        {/* ERROR */}
        {error && (
          <section className="error-box">

            <h2>{t.importError}</h2>

            <p>{t.invalidFile}</p>

          </section>
        )}


        {/* BUILDING */}
        {building && (
          <section className="building-section">

            {/* BUILDING INFO */}
            <div className="building-info">

              <h2>{building.building}</h2>

              <p>
                {building.nodes.length} {t.nodes} ·{" "}
                {building.edges.length} {t.corridorCount}
              </p>

            </div>


            {/* START LOCATION */}
            <div className="controls">

              <label htmlFor="start">
                {t.starting}
              </label>

              <select
                id="start"
                value={startNode}
                onChange={handleStartChange}
              >

                <option value="">
                  {t.select}
                </option>

                {building.nodes
                  .filter(
                    (node) =>
                      node.type === "room" ||
                      node.type === "junction"
                  )
                  .map((node) => (
                    <option
                      key={node.id}
                      value={node.id}
                    >
                      {node.id} - {node.label}
                    </option>
                  ))}

              </select>

            </div>


            {/* EMERGENCY CONTROLS */}
            <div className="hazard-controls">

              <h3>{t.emergency}</h3>


              {/* BLOCKED CORRIDORS */}
              <h4>{t.corridors}</h4>

              <div className="hazard-list">

                {building.edges.map((edge) => {

                  const isBlocked =
                    currentState.blocked_edges.includes(
                      edge.id
                    );

                  return (
                    <button
                      key={edge.id}
                      className={
                        isBlocked
                          ? "hazard-active"
                          : ""
                      }
                      onClick={() =>
                        toggleEdge(edge.id)
                      }
                    >
                      {isBlocked ? "🚧 " : ""}

                      {edge.id} — {edge.from} →{" "}
                      {edge.to}
                    </button>
                  );

                })}

              </div>


              {/* CLOSED EXITS */}
              <h4>{t.exits}</h4>

              <div className="hazard-list">

                {building.nodes
                  .filter(
                    (node) => node.type === "exit"
                  )
                  .map((exit) => {

                    const isClosed =
                      currentState.closed_exits.includes(
                        exit.id
                      );

                    return (
                      <button
                        key={exit.id}
                        className={
                          isClosed
                            ? "hazard-active"
                            : ""
                        }
                        onClick={() =>
                          toggleExit(exit.id)
                        }
                      >
                        {isClosed ? "🚪 " : ""}

                        {exit.id} — {exit.label}
                      </button>
                    );

                  })}

              </div>


              {/* BLOCKED LOCATIONS */}
              <h4>{t.locations}</h4>

              <div className="hazard-list">

                {building.nodes
                  .filter(
                    (node) =>
                      node.type === "room" ||
                      node.type === "junction"
                  )
                  .map((node) => {

                    const isBlocked =
                      currentState.blocked_nodes.includes(
                        node.id
                      );

                    return (
                      <button
                        key={node.id}
                        className={
                          isBlocked
                            ? "hazard-active"
                            : ""
                        }
                        onClick={() =>
                          toggleNode(node.id)
                        }
                      >
                        {isBlocked ? "⚠️ " : ""}

                        {node.id} — {node.label}
                      </button>
                    );

                  })}

              </div>


              {/* RESET */}
              <button
                className="reset-button"
                onClick={resetEmergencyState}
              >
                {t.reset}
              </button>

            </div>


            {/* ROUTE STATUS */}
            {route && (
              <div
                className={`route-status ${route.status}`}
              >

                {route.status === "success" && (
                  <>
                    <strong>
                      {t.routeFound}
                    </strong>

                    <p>
                      {route.path.join(" → ")}
                    </p>

                    <p>
                      {t.exit}:{" "}
                      <strong>
                        {route.exit}
                      </strong>

                      {" | "}

                      {t.cost}:{" "}
                      <strong>
                        {route.cost}
                      </strong>
                    </p>
                  </>
                )}


                {route.status === "no-route" && (
                  <strong>
                    {t.noRoute}
                  </strong>
                )}


                {route.status === "blocked" && (
                  <strong>
                    {t.blocked}
                  </strong>
                )}

              </div>
            )}


            {/* MAP */}
            <div className="map">

              {/* EDGES */}
              {building.edges.map((edge) => {

                const from =
                  building.nodes.find(
                    (node) =>
                      node.id === edge.from
                  );

                const to =
                  building.nodes.find(
                    (node) =>
                      node.id === edge.to
                  );

                if (!from || !to) {
                  return null;
                }

                const length = Math.sqrt(
                  (to.x - from.x) ** 2 +
                    (to.y - from.y) ** 2
                );

                const angle = Math.atan2(
                  to.y - from.y,
                  to.x - from.x
                );

                const isBlocked =
                  currentState.blocked_edges.includes(
                    edge.id
                  );

                return (
                  <div
                    key={edge.id}
                    className={`
                      edge
                      ${
                        isRouteEdge(edge)
                          ? "route-edge"
                          : ""
                      }
                      ${
                        isBlocked
                          ? "blocked-edge"
                          : ""
                      }
                    `}
                    style={{
                      left: `${from.x}px`,
                      top: `${from.y}px`,
                      width: `${length}px`,
                      transform: `rotate(${angle}rad)`,
                    }}
                  >
                    <span>{edge.cost}</span>
                  </div>
                );

              })}


              {/* NODES */}
              {building.nodes.map((node) => {

                const isBlocked =
                  currentState.blocked_nodes.includes(
                    node.id
                  );

                const isClosedExit =
                  node.type === "exit" &&
                  currentState.closed_exits.includes(
                    node.id
                  );

                return (
  <div
  key={node.id}
  className={`
    node
    ${node.type}
    ${node.id === startNode ? "start-node" : ""}
    ${
      route &&
      route.status === "success" &&
      node.id === route.exit
        ? "route-exit"
        : ""
    }
                      ${
                        isBlocked
                          ? "blocked-node"
                          : ""
                      }
                      ${
                        isClosedExit
                          ? "closed-exit"
                          : ""
                      }
                    `}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                    }}
                  >

                    <div className="node-circle">
                      {node.id}
                    </div>

                    <div className="node-label">
                      {node.label}
                    </div>

                  </div>
                );

              })}

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;