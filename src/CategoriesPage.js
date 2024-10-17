import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import DrawerComponent from './CategoriesDrawerComponent';
import {
    CosmographProvider,
    Cosmograph,
    CosmographSearch,
    useCosmograph,
    CosmographTimeline 
  } from "@cosmograph/react";

import * as d3 from 'd3'; // Import d3
import CategoryViewer from './CategoryViewer';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';


const CategoriesPage = () => {
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showLabelsFor, setShowLabelsFor] = useState(undefined);
    const [connectedNodes, setConnectedNodes] = useState(new Set());
    const [categoryViewerSelectedNode, setCategoryViewerSelectedNode] = useState(null);
    const cosmographRef = useRef(null);
    const searchRef = useRef(null);
    const [citingNodes, setCitingNodes] = useState([]);
    const [citedNodes, setCitedNodes] = useState([]);
    const [siblingNodes, setSiblingNodes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadCosmograph, setLoadCosmograph] = useState(false);
    const [showCategoryViewer, setShowCategoryViewer] = useState(false); // Add state for showing CategoryViewer
    const handleButtonClick = () => {
      setShowCategoryViewer(true); // Set showCategoryViewer to true when the button is clicked
    };
    const categoryViewerRef = useRef(null); // Add this line
    const scrollToCategoryViewer = () => {
      if (categoryViewerRef.current) {
          categoryViewerRef.current.scrollIntoView({ behavior: 'smooth' });
          categoryViewerRef.current.style.animation = 'highlight 2s';
      }
  };

  const handleCategoryViewerNodeSelect = useCallback((node) => {
    setCategoryViewerSelectedNode(node);
}, []);


    
    useEffect(() => {
      const fetchData = async () => {
        try {

          const response = await fetch('/converted_categories.csv'); // Fetch the CSV file
          const data = await response.text();
          const table = d3.csvParse(data); // Parse the CSV data and create the root object
          const width = 3000;
          const height = width;
          const cx = width * 0.5; // adjust as needed to fit
          const cy = height * 0.59; // adjust as needed to fit
          const radius = Math.min(width, height) / 2 - 30;

          const stratify = d3.stratify()
            .id((d) => d.id)
            .parentId((d) => d.parent) // Assuming 'primaryParent' is the parent ID in the CSV
          (table); 

          stratify
          .sum((d) => d.value)
          .sort((a, b) => b.height - a.height || d3.ascending(a.id, b.id));

          const tree = d3.tree()
          .size([2 * Math.PI, radius])
          .separation(function separation(a, b) {
            return (a.parent == b.parent ? 1 : 2) / a.depth;
          });
          
          var root = tree(stratify);
          function radialPoint(x, y) {
              return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
            }
                         
          const processedNodes = root.descendants().map(node => {
              
             
              const [x, y] = radialPoint(node.x, node.y);
                  return {
                    id: node.data.id,
                    x: x,
                    y: y
                  };
                });        

        

          const processedLinks = table.slice(1).map(row => ({
              source: row.parent,
              target: row.id,
            }));
      
          // ... existing code ...
    
          setNodes(processedNodes);
          setLinks(processedLinks);
          console.log('Formatted links:', processedLinks.slice(0, 5));

        } catch (error) {
          console.error('Error fetching data:', error);
          setError(error);
        }
      };
    
      fetchData();
    }, []);


      
    
    const updateConnectedNodes = useCallback((node) => {
        if (!node) {
          setConnectedNodes(new Set());
          setCitingNodes([]);
          setCitedNodes([]);
          setSiblingNodes([]); // Add this line to clear sibling nodes when no node is selected

          return;
        }
        const connected = new Set();
        const citing = [];
        const cited = [];
        const siblings = []; // Add this line to store sibling nodes

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
        const parentNode = nodes.find(n => n.id === node.parent);

        if (parentNode) {
          // Find all links where the parent node is the source
          links.forEach(link => {
            if (link.source === parentNode.id && link.target !== node.id) {
              const siblingNode = nodes.find(n => n.id === link.target);
              if (siblingNode) {
                siblings.push(siblingNode);
              }
            }
          });
        }
      

        setConnectedNodes(connected);
        setCitingNodes(citing);
        setCitedNodes(cited);
        setSiblingNodes(siblings); // Add this line to set the sibling nodes

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
    

      const getNodeColor = useCallback((node) => {
        if (!node) return 'gray'; // Default color for nodes without a valid ID
      
        const colorMap = {
          'Philosophy, Misc': '#907AD6',
          'Metaphysics and Epistemology': '#EECFD4',
          'Value Theory': '#BFEDEF',
          'Science, Logic, and Mathematics': '#FF1B1C',
          'History of Western Philosophy': '#FFE74C',
          'Philosophical Traditions': '#8B008B', // Made up color: Dark Magenta
          'Other Academic Areas': '#00CED1', // Made up color: Dark Turquoise
        };
      
        const findMatchingAncestor = (nodeId) => {
          if (nodeId === 'Philosophy') return null;
          if (colorMap[nodeId]) return colorMap[nodeId];
      
          const parentLink = links.find(link => link.target === nodeId);
          if (!parentLink) return null;
      
          return findMatchingAncestor(parentLink.source);
        };
      
        const matchingColor = findMatchingAncestor(node.id);
        return matchingColor || 'gray'; // Default color if no matching ancestor is found
      }, [links]);




    return (
      <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <CosmographProvider nodes={nodes} links={links}>

      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <CosmographSearch 
                ref={searchRef}
                accessors={[
                  { label: 'Title', accessor: (node) => node.id },
                ]} 
                maxVisibleItems={10} 
                onSelectResult={onSearchSelectResult} 
                style={{ margin: '0' }}

              />
      </AppBar>
      
      <DrawerComponent 
        selectedNode={selectedNode}
        citingNodes={citingNodes}
        citedNodes={citedNodes}
        onNodeSelect={selectNode}
        siblingNodes={siblingNodes}
        categoryViewerSelectedNode={categoryViewerSelectedNode}

        >

      </DrawerComponent>
      
      
          <Box component="main" sx={{ flexGrow: 1, p: 0}}>
            <Toolbar/>
          <Grid container spacing={2}>
          <Grid size={12}>

          <Cosmograph 
            ref={cosmographRef}
            disableSimulation={false}
            spaceSize={4000}
            useQuadtree={false}
            repulsionQuadtreeLevels={12}
            showFPSMonitor={false}
            simulationGravity={0.05}
            simulationRepulsion={1.5}
            simulationFriction={0.9}
            showDynamicLabels={true}
            showLabelsFor={selectedNode ? [selectedNode, ...Array.from(connectedNodes)] : undefined}
            linkVisibilityDistance={[20,600]}
            linkVisibilityMinTransparency={0.5}
            linkGreyoutOpacity={0.1}
            renderLinks={true}
            nodeLabelAccessor={(node) => node.title || node.id}
            pixelRatio={1}
            linkArrows={true}
            initialZoomLevel={3}
            simulationLinkDistance={20}
            simulationCenter={0.3}
            backgroundColor={'#3f4144'}
            nodeLabelColor={"#ffffff"}
            onClick={onCosmographClick}
            simulationLinkSpring={0.5}
            simulationRepublsion={1.5}
            nodeSize={3}
            nodeColor={getNodeColor}
          />
          </Grid>
          <Grid size={12}>
              {selectedNode && (
                <div ref={categoryViewerRef}>
                      <h2>Top publications for {selectedNode.id}</h2>
          <CategoryViewer mainselect={selectedNode}
          onNodeSelect={handleCategoryViewerNodeSelect}
                                          />
          </div>
        ) }
        </Grid>
        </Grid>
        </Box>


          </CosmographProvider>

        </Box>
      
    );
  };
  
  export default CategoriesPage;

