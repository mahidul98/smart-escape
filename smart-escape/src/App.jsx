import { useState } from "react";
import "./App.css";
import { findShortestRoute } from "./utils/dijkstra";

function App() {
const [building, setBuilding] = useState(null);
const [error, setError] = useState("");
const [startNode, setStartNode] = useState("");
const [route, setRoute] = useState(null);
const [currentState, setCurrentState] = useState({
  blocked_nodes: [],
  blocked_edges: [],
  closed_exits: [],
});

  // Import building.json
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
setError("");

setCurrentState({
  blocked_nodes: data.initial_state?.blocked_nodes || [],
  blocked_edges: data.initial_state?.blocked_edges || [],
  closed_exits: data.initial_state?.closed_exits || [],
});
      } catch (err) {
        setBuilding(null);
        setRoute(null);
        setError("Invalid building.json file");
      }
    };

    reader.readAsText(file);
  }

  // Handle starting location selection
  function handleStartChange(event) {
    const selectedStart = event.target.value;

    setStartNode(selectedStart);

    if (!building || !selectedStart) {
      setRoute(null);
      return;
    }

const result = findShortestRoute(
  building.nodes,
  building.edges,
  selectedStart,
  currentState
);

    setRoute(result);
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Smart Escape</h1>
          <p>Interactive Evacuation Route Simulator</p>
        </div>

        <label className="import-button">
          Import Building
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileImport}
            hidden
          />
        </label>
      </header>

      <main className="main">
        {/* Welcome screen */}
        {!building && !error && (
          <section className="welcome">
            <h2>Smart Escape</h2>

            <p>
              Import a building.json file to visualize the building
              and calculate evacuation routes.
            </p>

            <label className="big-import-button">
              Choose building.json

              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                hidden
              />
            </label>
          </section>
        )}

        {/* Error */}
        {error && (
          <section className="error-box">
            <h2>Import Error</h2>
            <p>{error}</p>
          </section>
        )}

        {/* Building */}
        {building && (
          <section className="building-section">
<div className="hazard-controls">
  <h3>Emergency Controls</h3>

  <h4>Blocked Corridors</h4>

  <div className="hazard-list">
    <h4>Closed Exits</h4>

<div className="hazard-list">
  {building.nodes
    .filter((node) => node.type === "exit")
    .map((exit) => {
      const isClosed =
        currentState.closed_exits.includes(exit.id);

      return (
        <button
          key={exit.id}
          className={isClosed ? "hazard-active" : ""}
          onClick={() => {
            const newState = {
              ...currentState,
              closed_exits: isClosed
                ? currentState.closed_exits.filter(
                    (id) => id !== exit.id
                  )
                : [
                    ...currentState.closed_exits,
                    exit.id,
                  ],
            };

            setCurrentState(newState);

            if (startNode) {
              const result = findShortestRoute(
                building.nodes,
                building.edges,
                startNode,
                newState
              );

              setRoute(result);
            }
          }}
        >
          {isClosed ? "🚪 " : ""}
          {exit.id} — {exit.label}
        </button>
      );
    })}
</div>
    {building.edges.map((edge) => {
      const isBlocked =
        currentState.blocked_edges.includes(edge.id);

      return (
        <button
          key={edge.id}
          className={isBlocked ? "hazard-active" : ""}
          onClick={() => {
            const newState = {
              ...currentState,
              blocked_edges: isBlocked
                ? currentState.blocked_edges.filter(
                    (id) => id !== edge.id
                  )
                : [
                    ...currentState.blocked_edges,
                    edge.id,
                  ],
            };

            setCurrentState(newState);

            if (startNode) {
              const result = findShortestRoute(
                building.nodes,
                building.edges,
                startNode,
                newState
              );

              setRoute(result);
            }
          }}
        >
          {isBlocked ? "🚧 " : ""}
          {edge.id}
          {" — "}
          {edge.from} → {edge.to}
        </button>
      );
    })}
  </div>
</div>
            <div className="building-info">
              <h2>{building.building}</h2>

              <p>
                {building.nodes.length} nodes ·{" "}
                {building.edges.length} corridors
              </p>
            </div>

            {/* Starting location */}
            <div className="controls">
              <label htmlFor="start">
                Starting Location
              </label>

              <select
                id="start"
                value={startNode}
                onChange={handleStartChange}
              >
                <option value="">
                  Select starting location
                </option>

                {building.nodes
                  .filter(
                    (node) =>
                      node.type === "room" ||
                      node.type === "junction"
                  )
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.id} - {node.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Route result */}
            {route && (
              <div className={`route-status ${route.status}`}>
                {route.status === "success" && (
                  <>
                    <strong>Route found</strong>

                    <p>
                      {route.path.join(" → ")}
                    </p>

                    <p>
                      Exit: <strong>{route.exit}</strong>
                      {" | "}
                      Cost: <strong>{route.cost}</strong>
                    </p>
                  </>
                )}

                {route.status === "no-route" && (
                  <strong>
                    No route available
                  </strong>
                )}

                {route.status === "blocked" && (
                  <strong>
                    Starting location blocked
                  </strong>
                )}
              </div>
            )}

            {/* Building map */}
            <div className="map">
              {/* Corridors */}
              {building.edges.map((edge) => {
                const from = building.nodes.find(
                  (node) => node.id === edge.from
                );

                const to = building.nodes.find(
                  (node) => node.id === edge.to
                );

                if (!from || !to) return null;

                const length = Math.sqrt(
                  (to.x - from.x) ** 2 +
                    (to.y - from.y) ** 2
                );

                const angle = Math.atan2(
                  to.y - from.y,
                  to.x - from.x
                );

                return (
                  <div
                    key={edge.id}
                    className="edge"
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

              {/* Nodes */}
              {building.nodes.map((node) => (
                <div
                  key={node.id}
                  className={`node ${node.type}`}
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
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;