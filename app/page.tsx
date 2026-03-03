"use client"
import { useEffect, useState, useRef } from "react";
import initPlanet3D from "@/components/3D/planet"
import initIndiaViewer from "@/components/3D/india-viewer"

export default function Home() {
  const [showIndiaMap, setShowIndiaMap] = useState(false);
  const [mapMode, setMapMode] = useState<'satellite' | 'heatmap'>('satellite');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ setTexture: (path: string) => void; dispose: () => void } | null>(null);

  useEffect(() => {
    initPlanet3D({
      onIndiaClick: () => setShowIndiaMap(true)
    });
  }, [])

  useEffect(() => {
    if (showIndiaMap && mapContainerRef.current) {
      const viewer = initIndiaViewer({
        container: mapContainerRef.current,
        texturePath: mapMode === 'satellite' 
          ? "/countries/india/color-map-india.png" 
          : "/countries/india/heatmap-india.png"
      });
      viewerRef.current = viewer;

      return () => {
        viewer.dispose();
        viewerRef.current = null;
      }
    }
  }, [showIndiaMap]);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setTexture(
        mapMode === 'satellite'
          ? "/countries/india/color-map-india.png"
          : "/countries/india/heatmap-india.png"
      );
    }
  }, [mapMode]);

  return (
    <div className="page">
      <section className="hero_main">
        <div className="content">
          <h1>Earth</h1>
          <p>The third planet from the Sun.</p>
        </div>
        <canvas className="planet-3D" />
      </section>

      {showIndiaMap && (
        <div className="map-modal-overlay" onClick={() => setShowIndiaMap(false)}>
          <div className="map-modal huge" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowIndiaMap(false)}>×</button>
            <div className="map-container zoomable" ref={mapContainerRef}>
              {/* Zoomable viewer injected here */}
              <div className="map-toggle-container">
                <button 
                  className={`toggle-btn ${mapMode === 'satellite' ? 'active' : ''}`}
                  onClick={() => setMapMode('satellite')}
                >
                  Satellite
                </button>
                <button 
                  className={`toggle-btn ${mapMode === 'heatmap' ? 'active' : ''}`}
                  onClick={() => setMapMode('heatmap')}
                >
                  Heatmap
                </button>
              </div>
            </div>
            <div className="map-info">
              <h2>India - {mapMode === 'satellite' ? 'Satellite' : 'Elevation Heatmap'} View</h2>
              <p>Drag to move. Scroll to zoom. Use buttons to switch view.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
