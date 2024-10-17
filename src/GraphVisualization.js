import React, { useMemo, useCallback, useState, useRef, useEffect} from 'react';
import { Cosmograph, CosmographRef } from '@cosmograph/react'
import { useCosmograph, useCosmographState} from'@cosmograph/react'

export function GraphVisualization({ selectedNode, onNodeSelect, searchRef }) {
  
  const { cosmograph, nodes, links } = useCosmograph()
  const [showLabelsFor, setShowLabelsFor] = useState(undefined);
  const [connectedNodes, setConnectedNodes] = useState(new Set());
  const cosmographRef = useRef(null);

  const parseYear = (year) => {
    if (typeof year === 'number' && !isNaN(year)) return year;
    if (typeof year === 'string') {
      // Remove any non-digit characters
      const cleanedYear = year.replace(/\D/g, '');
      const parsed = parseInt(cleanedYear, 10);
      if (!isNaN(parsed)) return parsed;
    }
    //console.log(`Invalid year value: ${year}, type: ${typeof year}`);
    return null; // Return null for invalid years
  };

  const [nodeLinkCounts, minYear, maxYear] = useMemo(() => {
    const linkCounts = new Map();
    links.forEach(link => {
      linkCounts.set(link.target, (linkCounts.get(link.target) || 0) + 1);
    });

    const years = nodes
      .map(node => {
        const parsedYear = parseYear(node.citation_year);
        //console.log(`Node ${node.id}: Original year: ${node.citation_year}, Parsed year: ${parsedYear}`);
        return parsedYear;
      })
      .filter(year => year !== null);

    //console.log('Filtered years:', years);

    if (years.length === 0) {
      console.warn('No valid years found in the data');
      return [linkCounts, null, null];
    }

    const minYear = Math.min(...years);
    const maxYear = 2024;

    console.log('Year range:', minYear, '-', maxYear);

    return [linkCounts, minYear, maxYear];
  }, [nodes, links]);

  const getNodeSize = (node) => {
    const linkCount = nodeLinkCounts.get(node.id) || 0;
    // Adjust these values to change the min and max node sizes
    const minSize = 3;
    const maxSize = 15;
    return minSize + (linkCount * (maxSize - minSize) / Math.max(...nodeLinkCounts.values()));
  };

  
  const getNodeColor = useCallback((node) => {
    const year = parseYear(node.citation_year);
    
    if (year === null) {
      return '#808080';  // Gray for invalid year
    }

    const normalizedYear = (year - minYear) / (maxYear - minYear);
    
    // Interpolate between two colors
    const startColor = [65, 182, 196];  // Light teal
    const endColor = [227, 116, 43];    // Light orange

    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * normalizedYear);
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * normalizedYear);
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * normalizedYear);

    const baseColor = `rgb(${r}, ${g}, ${b})`;

    if (selectedNode && (node.id === selectedNode.id || connectedNodes.has(node.id))) {
      // Create a lighter shade of the base color
      const lighterR = Math.min(255, r + 50);
      const lighterG = Math.min(255, g + 50);
      const lighterB = Math.min(255, b + 50);
      return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
    }

    return baseColor;
  }, [selectedNode, connectedNodes, minYear, maxYear]);
  
  const updateConnectedNodes = useCallback((node) => {
    if (!node) {
      setConnectedNodes(new Set());
      return;
    }
    const connected = new Set();
    links.forEach(link => {
      if (link.source === node.id) connected.add(link.target);
      if (link.target === node.id) connected.add(link.source);
    });
    setConnectedNodes(connected);
  }, [links]);



  useEffect(() => {
    updateConnectedNodes(selectedNode);
  }, [selectedNode, updateConnectedNodes]);

  
  const onCosmographClick = useCallback((n) => {
    searchRef?.current?.clearInput();
    if (n) {
      cosmographRef.current?.selectNode(n, true);
      console.log(n)
      setShowLabelsFor([n]);
      onNodeSelect(n);
      // Update connected nodes
      const connected = new Set();
      links.forEach(link => {
        if (link.source === n.id) connected.add(link.target);
        if (link.target === n.id) connected.add(link.source);
      });
      setConnectedNodes(connected);
    } else {
      cosmographRef.current?.unselectNodes();
      setShowLabelsFor(undefined);
      onNodeSelect(null);
      setConnectedNodes(new Set());
    }
  }, [links, onNodeSelect,  searchRef]);

  return (
    <Cosmograph 
        disableSimulation={false}
        spaceSize={8192}
        useQuadtree={true}
        repulsionQuadtreeLevels={4}
        showFPSMonitor={false}
        simulationGravity={0.25}
        simulationRepulsion={1.5}
        simulationFriction={0.9}
        showDynamicLabels={true}
        showLabelsFor={selectedNode ? [selectedNode, ...Array.from(connectedNodes)] : undefined}
        linkVisibilityDistance={[20,600]}
        linkVisibilityMinTransparency={0.2}
        linkGreyoutOpacity={0.1}
        renderLinks={true}
        nodeSize={getNodeSize}
        nodeLabelAccessor={(node) => node.title || node.id}
        nodeColor={getNodeColor}
        pixelRatio={1}
        linkArrows={false}
        initialZoomLevel={3}
        simulationLinkDistance={9}
        backgroundColor={'#3f4144'}
        //hoveredNodeLabelClassName="node-label hovered"
        nodeLabelColor={"#ffffff"} // White text
        onClick={onCosmographClick}
  
    />
  )
}