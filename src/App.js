import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CosmographProvider,
  Cosmograph,
  CosmographSearch,
  useCosmograph,
  CosmographTimeline 
} from "@cosmograph/react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import { TextField, Typography } from '@mui/material';
import CategoriesPage from './CategoriesPage';
import { BrowserRouter as Router, Route, Switch, Routes } from 'react-router-dom';
import PublicationsPage from './PublicationsPage';


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App = () => {


  return (
  
  
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/publications" element={<PublicationsPage />}/>
        </Routes>
      </Router>
    </ThemeProvider>
    
  );
};

export default App;