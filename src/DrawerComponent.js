import React, { useState, useMemo } from 'react';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from '@mui/material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
const DRAWER_WIDTH = 350; // Increased drawer width

const DrawerComponent = ({ children, selectedNode, citingNodes = [], citedNodes = [], siblingNodes = [], onNodeSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsOpen(open);
  };

  const sortedCitedNodes = useMemo(() => {
    return [...citedNodes].sort((a, b) => (b.impact || 0) - (a.impact || 0));
  }, [citedNodes]);
  
  const drawerContent = () => (
    <Box
      sx={{ width: DRAWER_WIDTH }}
      role="presentation"
    >
      <Box sx={{ p: 0 }}>
        {children}
        {selectedNode && (
          <div>
            <Typography variant="h6" gutterBottom>{selectedNode.title}</Typography>
            <Typography variant="body2"><strong>ID:</strong> {selectedNode.id}</Typography>
            <Typography variant="body2"><strong>Author:</strong> {selectedNode.author}</Typography>
            <Typography variant="body2"><strong>Year:</strong> {selectedNode.year}</Typography>
            
            <Box mt={1} mb={2}>
              <Link
                href={`https://philpapers.org/rec/${selectedNode.id}`}
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
              >
                View on PhilPapers
                <OpenInNewIcon fontSize="small" style={{ marginLeft: '4px' }} />
              </Link>
            </Box>
            <Divider style={{ margin: '16px 0' }} />
            
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="citing-nodes-content"
                id="citing-nodes-header"
              >
                <Typography>Cited By: ({citingNodes.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                                <List dense>
                  {citingNodes.length > 0 ? (
                    citingNodes.map((node) => (
                      <ListItem 
                        key={node.id} 
                        button 
                        onClick={() => onNodeSelect(node)}
                      >
                        <ListItemText 
                          primary={node.title} 
                          secondary={`${node.author}, ${node.parsed_citation_year || 'Unknown'}`} 
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No citing nodes" />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="cited-nodes-content"
                id="cited-nodes-header"
              >
                <Typography>Cites: ({citedNodes.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {citedNodes.length > 0 ? (
                    citedNodes.map((node) => (
                      <ListItem 
                        key={node.id} 
                        button 
                        onClick={() => onNodeSelect(node)}
                      >
                        <ListItemText 
                          primary={node.title} 
                          secondary={`${node.author}, ${node.citation_year}`} 
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No cited nodes" />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="sibling-nodes-content"
                id="sibling-nodes-header"
              >
                <Typography>Siblings: ({siblingNodes.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {siblingNodes.length > 0 ? (
                    siblingNodes.map((node) => (
                      <ListItem 
                        key={node.id} 
                        button 
                        onClick={() => onNodeSelect(node)}
                      >
                        <ListItemText 
                          primary={node.id} 
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No sibling nodes" />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </div>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <IconButton onClick={toggleDrawer(true)}>
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleDrawer(false)}
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent()}
      </Drawer>
    </>
  );
};

export default DrawerComponent;