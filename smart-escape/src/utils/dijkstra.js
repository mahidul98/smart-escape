export function findShortestRoute(
  nodes,
  edges,
  startNode,
  state = {}
) {
  const blockedNodes = state.blocked_nodes || [];
  const blockedEdges = state.blocked_edges || [];
  const closedExits = state.closed_exits || [];

  // Starting location is blocked
  if (blockedNodes.includes(startNode)) {
    return {
      status: "blocked",
      path: [],
      exit: null,
      cost: null,
    };
  }

  // Build a quick node lookup
  const nodeMap = {};

  nodes.forEach((node) => {
    nodeMap[node.id] = node;
  });

  // Only allow usable nodes
  const usableNodes = nodes.filter(
    (node) =>
      !blockedNodes.includes(node.id) &&
      !(
        node.type === "exit" &&
        closedExits.includes(node.id)
      )
  );

  const usableNodeIds = new Set(
    usableNodes.map((node) => node.id)
  );

  // Build adjacency list
  const graph = {};

  usableNodes.forEach((node) => {
    graph[node.id] = [];
  });

  edges.forEach((edge) => {
    // Ignore blocked corridors
    if (blockedEdges.includes(edge.id)) {
      return;
    }

    // Ignore corridors connected to blocked nodes
    if (
      blockedNodes.includes(edge.from) ||
      blockedNodes.includes(edge.to)
    ) {
      return;
    }

    // Ignore corridors connected to closed/unusable nodes
    if (
      !usableNodeIds.has(edge.from) ||
      !usableNodeIds.has(edge.to)
    ) {
      return;
    }

    graph[edge.from].push({
      node: edge.to,
      cost: Number(edge.cost),
    });

    graph[edge.to].push({
      node: edge.from,
      cost: Number(edge.cost),
    });
  });

  // Dijkstra initialization
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  usableNodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  distances[startNode] = 0;

  // Dijkstra
  while (unvisited.size > 0) {
    let current = null;
    let smallestDistance = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < smallestDistance) {
        smallestDistance = distances[nodeId];
        current = nodeId;
      }
    }

    // No more reachable nodes
    if (current === null) {
      break;
    }

    unvisited.delete(current);

    for (const neighbor of graph[current]) {
      if (!unvisited.has(neighbor.node)) {
        continue;
      }

      const newDistance =
        distances[current] + neighbor.cost;

      if (newDistance < distances[neighbor.node]) {
        distances[neighbor.node] = newDistance;
        previous[neighbor.node] = current;
      }
    }
  }

  // Find cheapest available exit
  const availableExits = usableNodes.filter(
    (node) => node.type === "exit"
  );

  let bestExit = null;
  let bestCost = Infinity;

  for (const exit of availableExits) {
    if (distances[exit.id] < bestCost) {
      bestCost = distances[exit.id];
      bestExit = exit.id;
    }
  }

  // No exit can be reached
  if (!bestExit || bestCost === Infinity) {
    return {
      status: "no-route",
      path: [],
      exit: null,
      cost: null,
    };
  }

  // Reconstruct path
  const path = [];
  let current = bestExit;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    status: "success",
    path,
    exit: bestExit,
    cost: bestCost,
  };
}