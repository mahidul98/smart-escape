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

  // Calculate route
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

  // Starting location changed
  function handleStartChange(event) {
    const selectedStart = event.target.value;

    setStartNode(selectedStart);
    calculateRoute(selectedStart, currentState);
  }

  // Change emergency state and immediately recalculate
  function updateState(newState) {
    setCurrentState(newState);

    if (startNode) {
      calculateRoute(startNode, newState);
    }
  }

  // Toggle blocked corridor
  function toggleEdge(edgeId) {
    const isBlocked =
      currentState.blocked_edges.includes(edgeId);

    const newState = {
      ...currentState,
      blocked_edges: isBlocked
        ? currentState.blocked_edges.filter(
            (id) => id !== edgeId
          )
        : [
            ...currentState.blocked_edges,
            edgeId,
          ],
    };

    updateState(newState);
  }

  // Toggle closed exit
  function toggleExit(exitId) {
    const isClosed =
      currentState.closed_exits.includes(exitId);

    const newState = {
      ...currentState,
      closed_exits: isClosed
        ? currentState.closed_exits.filter(
            (id) => id !== exitId
          )
        : [
            ...currentState.closed_exits,
            exitId,
          ],
    };

    updateState(newState);
  }

  // Toggle blocked room/junction
  function toggleNode(nodeId) {
    const isBlocked =
      currentState.blocked_nodes.includes(nodeId);

    const newState = {
      ...currentState,
      blocked_nodes: isBlocked
        ? currentState.blocked_nodes.filter(
            (id) => id !== nodeId
          )
        : [
            ...currentState.blocked_nodes,
            nodeId,
          ],
    };

    updateState(newState);
  }

  // Reset emergency state
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

  // Check whether a corridor belongs to the calculated route
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

        {/* WELCOME */}
        {!building && !error && (
          <section className="welcome">
            <h2>Smart Escape</h2>

            <p>
              Import a building.json file to visualize the
              building and calculate evacuation routes.
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

        {/* ERROR */}
        {error && (
          <section className="error-box">
            <h2>Import Error</h2>
            <p>{error}</p>
          </section>
        )}

        {/* BUILDING */}
        {building && (
          <section className="building-section">

            {/* BUILDING INFO */}
            <div className="building-info">
              <h2>{building.building}</h2>

              <p>
                {building.nodes.length} nodes ·{" "}
                {building.edges.length} corridors
              </p>
            </div>

            {/* START LOCATION */}
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
              <h3>Emergency Controls</h3>

              {/* BLOCKED CORRIDORS */}
              <h4>Blocked Corridors</h4>

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
              <h4>Closed Exits</h4>

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
              <h4>Blocked Locations</h4>

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
                Reset Emergency State
              </button>
            </div>

            {/* ROUTE RESULT */}
            {route && (
              <div
                className={`route-status ${route.status}`}
              >
                {route.status === "success" && (
                  <>
                    <strong>Route found</strong>

                    <p>
                      {route.path.join(" → ")}
                    </p>

                    <p>
                      Exit:{" "}
                      <strong>{route.exit}</strong>
                      {" | "}
                      Cost:{" "}
                      <strong>{route.cost}</strong>
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

            {/* BUILDING MAP */}
            <div className="map">

              {/* CORRIDORS */}
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
                    className={`edge ${
                      isRouteEdge(edge)
                        ? "route-edge"
                        : ""
                    } ${
                      isBlocked
                        ? "blocked-edge"
                        : ""
                    }`}
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
                    className={`node ${
                      node.type
                    } ${
                      isBlocked
                        ? "blocked-node"
                        : ""
                    } ${
                      isClosedExit
                        ? "closed-exit"
                        : ""
                    }`}
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