import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CosmographProvider,
  Cosmograph,
  CosmographSearch,
  useCosmograph,
  CosmographTimeline 
} from "@cosmograph/react";
import DrawerComponent from './DrawerComponent';
import CssBaseline from '@mui/material/CssBaseline';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import { TextField, Typography } from '@mui/material';


const PublicationsPage = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showLabelsFor, setShowLabelsFor] = useState(undefined);
  const [connectedNodes, setConnectedNodes] = useState(new Set());
  const cosmographRef = useRef(null);
  const searchRef = useRef(null);
  const [citingNodes, setCitingNodes] = useState([]);
  const [citedNodes, setCitedNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadCosmograph, setLoadCosmograph] = useState(false);
  const validateYear = (year) => {
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < -500 || parsedYear > 2030) {
      return null;
    }
    console.log(validateYear)
    return parsedYear;
  };
  
  const fetchData = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    } else {
      const text = await response.text();
      console.error(`Received non-JSON response from ${url}:`, text.substring(0, 200));
      throw new Error(`Received non-JSON response from ${url}`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [nodesData, linksData] = await Promise.all([
          fetchData('/main.json'),
          fetchData('/relations.json')
        ]);

        console.log('Raw nodes data:', nodesData.slice(0, 5));
        console.log('Raw links data:', linksData.slice(0, 5));

        const processedNodes = nodesData.map(node => ({
          id: node.id,
          title: node.title,
          author: node.author,
          citation_year: validateYear(node.citation_year),
          impact: node.impact
        }));

        console.log('Processed nodes:', processedNodes.slice(0, 5));

        const formattedLinks = linksData.map(link => ({
          source: link.source,
          target: link.target
        }));

        console.log('Formatted links:', formattedLinks.slice(0, 5));

        setNodes(processedNodes);
        setLinks(formattedLinks);

        console.log('Total Nodes:', processedNodes.length);
        console.log('Total Links:', formattedLinks.length);

        // Check for potential issues in links data
        const nodesSet = new Set(processedNodes.map(node => node.id));
        const invalidLinks = formattedLinks.filter(link => 
          !nodesSet.has(link.source) || !nodesSet.has(link.target)
        );

        if (invalidLinks.length > 0) {
          console.warn('Found invalid links:', invalidLinks);
        }

        // Log distribution of links per node
        const linkCounts = {};
        formattedLinks.forEach(link => {
          linkCounts[link.source] = (linkCounts[link.source] || 0) + 1;
          linkCounts[link.target] = (linkCounts[link.target] || 0) + 1;
        });

        const linkCountDistribution = Object.values(linkCounts).reduce((acc, count) => {
          acc[count] = (acc[count] || 0) + 1;
          return acc;
        }, {});

        console.log('Link count distribution:', linkCountDistribution);

      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);
  const getFilteredData = (nodes, links) => {
    const parsedMinCitationCount = 10
    const filteredNodes = nodes.filter(node => {
      const citationCount = links.filter(link => link.target === node.id).length;
      return isNaN(parsedMinCitationCount) || citationCount >= parsedMinCitationCount;
    });
    const filteredLinks = links.filter(link =>
      filteredNodes.some(node => node.id === link.source || node.id === link.target)
    );
    console.log(filteredNodes)
    return { nodes: filteredNodes, links: filteredLinks };
  };

  const handleNodeSelection = useCallback((node) => {
    console.log("Node selected:", node);
    setSelectedNode(node);
  }, []);


  const parseYear = (year) => {
    if (typeof year === 'number' && !isNaN(year)) return year;
    if (typeof year === 'string') {
      const cleanedYear = year.replace(/\D/g, '');
      const parsed = parseInt(cleanedYear, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };



  const [nodeLinkCounts, minYear, maxYear] = useMemo(() => {
    const linkCounts = new Map();
    links.forEach(link => {
      linkCounts.set(link.target, (linkCounts.get(link.target) || 0) + 1);
    });

    const years = nodes
      .map(node => parseYear(node.citation_year))
      .filter(year => year !== null);

    if (years.length === 0) {
      console.warn('No valid years found in the data');
      return [linkCounts, null, null];
    }

    const minYear = 1500;
    const maxYear = 2024;

    console.log('Year range:', minYear, '-', maxYear);

    return [linkCounts, minYear, maxYear];
  }, [nodes, links]);

  const getNodeSize = useCallback((node) => {
    const linkCount = nodeLinkCounts.get(node.id) || 0;
    const minSize = 3;
    const maxSize = 45;
    return minSize + (linkCount * (maxSize - minSize) / Math.max(...nodeLinkCounts.values()));
  }, [nodeLinkCounts]);

  const getNodeColor = useCallback((node) => {
    const year = parseYear(node.citation_year);
    
    if (year === null) {
      return '#808080';  // Gray for invalid year
    }
    console.log(year)
    const normalizedYear = (year - minYear) / (maxYear - minYear);
  
    
    const startColor = [60, 182, 196];  // Light teal
    const endColor = [227, 116, 43];    // Light orange

    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * normalizedYear);
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * normalizedYear);
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * normalizedYear);

    const baseColor = `rgb(${r}, ${g}, ${b})`;

    if (selectedNode && (node.id === selectedNode.id || connectedNodes.has(node.id))) {
      const lighterR = Math.min(255, r + 50);
      const lighterG = Math.min(255, g + 50);
      const lighterB = Math.min(255, b + 50);
      return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
    }
    console.log(r,g,b)
    return baseColor;
  }, [selectedNode, connectedNodes, minYear, maxYear]);

  const updateConnectedNodes = useCallback((node) => {
    if (!node) {
      setConnectedNodes(new Set());
      setCitingNodes([]);
      setCitedNodes([]);
      return;
    }
    const connected = new Set();
    const citing = [];
    const cited = [];
    links.forEach(link => {
      if (link.source === node.id) {
        connected.add(link.target);
        cited.push(nodes.find(n => n.id === link.target));
      }
      if (link.target === node.id) {
        connected.add(link.source);
        citing.push(nodes.find(n => n.id === link.source));
      }
    });
    setConnectedNodes(connected);
    setCitingNodes(citing);
    setCitedNodes(cited);
  }, [links, nodes]);

  const selectNode = useCallback((node) => {
    setSelectedNode(node);
    if (node) {
      cosmographRef.current?.selectNode(node, true);
      setShowLabelsFor([node]);
      updateConnectedNodes(node);
    } else {
      cosmographRef.current?.unselectNodes();
      setShowLabelsFor(undefined);
      updateConnectedNodes(null);
    }
  }, [updateConnectedNodes]);

  const onCosmographClick = useCallback((n) => {
    searchRef.current?.clearInput();
    selectNode(n || null);
  }, [selectNode]);

  const onSearchSelectResult = useCallback((n) => {
    selectNode(n || null);
  }, [selectNode]);

  

  return (
    <div>
        <CosmographProvider nodes={nodes} links={links}>
        <DrawerComponent 
            selectedNode={selectedNode}
            citingNodes={citingNodes}
            citedNodes={citedNodes}
            onNodeSelect={selectNode}
        >

          <div className="search-container">
            <CosmographSearch 
              ref={searchRef}
              accessors={[
                { label: 'Title', accessor: (node) => node.title },
                { label: 'Author', accessor: (node) => node.author }
              ]} 
              maxVisibleItems={10} 
              onSelectResult={onSearchSelectResult} 
            />
          </div>
        </DrawerComponent>
        <Cosmograph 
          ref={cosmographRef}
          disableSimulation={false}
          spaceSize={8192}
          useQuadtree={true}
          repulsionQuadtreeLevels={12}
          showFPSMonitor={false}
          simulationGravity={0.0}
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
          simulationLinkDistance={20}
          simulationCenter={0}
          backgroundColor={'#3f4144'}
          nodeLabelColor={"#ffffff"}
          onClick={onCosmographClick}
          simulationLinkSpring={0.5}
          simulationRepublsion={1.5}
        />
         <CosmographTimeline 
            accessor={node => node.citation_year ? new Date(node.citation_year, 0) : null}
            filterType="nodes"
            allowSelection={true}
            showAnimationControls={true}
            animationSpeed={100}
          />
      </CosmographProvider>
      </div>

    );
};

export default PublicationsPage;
