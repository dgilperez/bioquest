'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TaxonCard } from '@/components/tree-of-life/TaxonCard';
import { GapAnalysis } from '@/components/tree-of-life/GapAnalysis';
import { RegionalFilter } from '@/components/tree-of-life/RegionalFilter';
import { SunburstChart } from '@/components/tree-of-life/SunburstChart';
import { TreemapChart } from '@/components/tree-of-life/TreemapChart';
import { ChevronLeft, Home, Loader2, LayoutList, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaxonNode {
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  obsCount: number;
  userObsCount?: number;
  userSpeciesCount?: number;
  completionPercent?: number;
}

interface BreadcrumbItem {
  id: number;
  name: string;
  rank: string;
}

export function TreeOfLifeClient() {
  const [currentTaxonId, setCurrentTaxonId] = useState<number | null>(null);
  const [taxa, setTaxa] = useState<TaxonNode[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ id: number; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'sunburst' | 'treemap'>('list');

  // Load starting taxa or specific taxon
  useEffect(() => {
    loadTaxa(currentTaxonId);
  }, [currentTaxonId, selectedRegion]);

  const loadTaxa = async (taxonId: number | null) => {
    setIsLoading(true);
    setError(null);

    try {
      if (taxonId === null) {
        // Load starting iconic taxa
        const params = new URLSearchParams();
        if (selectedRegion) {
          params.append('regionId', selectedRegion.id.toString());
        }
        const url = `/api/tree-of-life/start${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to load starting taxa');
        }

        const data = await response.json();
        setTaxa(
          data.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            commonName: t.name,
            rank: t.rank,
            obsCount: t.obsCount,
            userObsCount: t.userObsCount,
            userSpeciesCount: t.userSpeciesCount,
            completionPercent: 0, // TODO: calculate
          }))
        );
        setBreadcrumbs([]);
      } else {
        // Load specific taxon and its children
        const params = new URLSearchParams();
        if (selectedRegion) {
          params.append('regionId', selectedRegion.id.toString());
        }
        const url = `/api/tree-of-life/taxon/${taxonId}${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to load taxon');
        }

        const data = await response.json();
        const taxonData = data.data;

        // Update breadcrumbs (build full path from ancestors)
        const ancestors = taxonData.taxon.ancestorIds || [];
        const newBreadcrumbs: BreadcrumbItem[] = ancestors.map((id: number) => ({
          id,
          name: `Taxon ${id}`, // We'd need to fetch names for full path
          rank: 'unknown',
        }));

        // Add current taxon to breadcrumbs
        newBreadcrumbs.push({
          id: taxonData.taxon.id,
          name: taxonData.taxon.commonName || taxonData.taxon.name,
          rank: taxonData.taxon.rank,
        });

        setBreadcrumbs(newBreadcrumbs);

        // Set children as taxa to display
        setTaxa(
          taxonData.children.map((child: any) => ({
            id: child.id,
            name: child.name,
            commonName: child.commonName,
            rank: child.rank,
            obsCount: child.obsCount,
            userObsCount: taxonData.userProgress?.observationCount || 0,
            userSpeciesCount: taxonData.userProgress?.speciesCount || 0,
            completionPercent: taxonData.userProgress?.completionPercent || 0,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading taxa:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaxonClick = (taxonId: number) => {
    setCurrentTaxonId(taxonId);
  };

  const handleBack = () => {
    if (breadcrumbs.length === 0) {
      return;
    }

    if (breadcrumbs.length === 1) {
      // Go back to root
      setCurrentTaxonId(null);
    } else {
      // Go to parent taxon
      const parentId = breadcrumbs[breadcrumbs.length - 2].id;
      setCurrentTaxonId(parentId);
    }
  };

  const handleHome = () => {
    setCurrentTaxonId(null);
  };

  const currentTaxonName =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Tree of Life';

  // Build hierarchical data structure for visualizations
  const buildHierarchicalData = (): TaxonNode & { children: TaxonNode[] } => {
    return {
      id: currentTaxonId || 0,
      name: currentTaxonName,
      rank: breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].rank : 'root',
      obsCount: taxa.reduce((sum, t) => sum + t.obsCount, 0),
      userObsCount: taxa.reduce((sum, t) => sum + (t.userObsCount || 0), 0),
      children: taxa,
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
            Tree of Life
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore taxonomy and track your completeness across the tree of life
          </p>
        </div>

        {/* Navigation buttons */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleHome} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          </div>
        )}
      </motion.div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <button
            onClick={handleHome}
            className="hover:text-nature-600 dark:hover:text-nature-400 transition-colors"
          >
            Home
          </button>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <span>/</span>
              {index < breadcrumbs.length - 1 ? (
                <button
                  onClick={() => setCurrentTaxonId(crumb.id)}
                  className="hover:text-nature-600 dark:hover:text-nature-400 transition-colors"
                >
                  {crumb.name}
                </button>
              ) : (
                <span className="font-semibold text-foreground">{crumb.name}</span>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Regional Filter */}
      <RegionalFilter
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
      />

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 p-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <span className="text-sm font-medium text-muted-foreground px-2">View:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-nature-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('sunburst')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'sunburst'
                ? 'bg-nature-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Network className="w-4 h-4" />
            Sunburst
          </button>
          <button
            onClick={() => setViewMode('treemap')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'treemap'
                ? 'bg-nature-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <LayoutList className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
            Treemap
          </button>
        </div>
      </motion.div>

      {/* Current level title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-xl border-2 border-nature-500 dark:border-nature-600 bg-nature-50 dark:bg-nature-950/20"
      >
        <h2 className="text-2xl font-display font-bold text-nature-700 dark:text-nature-300">
          {currentTaxonName}
        </h2>
        {breadcrumbs.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Showing children of rank: {breadcrumbs[breadcrumbs.length - 1].rank}
          </p>
        )}
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-nature-600" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Gap Analysis - Show when viewing a specific taxon */}
      {!isLoading && !error && currentTaxonId !== null && (
        <GapAnalysis
          taxonId={currentTaxonId}
          taxonName={currentTaxonName}
          regionId={selectedRegion?.id}
        />
      )}

      {/* Taxa display - conditional based on view mode */}
      {!isLoading && !error && (
        <>
          {taxa.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>No taxa found at this level.</p>
            </div>
          ) : (
            <>
              {/* List View */}
              {viewMode === 'list' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {taxa.map((taxon, index) => (
                    <TaxonCard
                      key={taxon.id}
                      id={taxon.id}
                      name={taxon.name}
                      commonName={taxon.commonName}
                      rank={taxon.rank}
                      globalObsCount={taxon.obsCount}
                      userObsCount={taxon.userObsCount}
                      userSpeciesCount={taxon.userSpeciesCount}
                      completionPercent={taxon.completionPercent}
                      onClick={() => handleTaxonClick(taxon.id)}
                      index={index}
                    />
                  ))}
                </motion.div>
              )}

              {/* Sunburst View */}
              {viewMode === 'sunburst' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <SunburstChart
                    data={buildHierarchicalData()}
                    onNodeClick={(node) => handleTaxonClick(node.id)}
                  />
                </motion.div>
              )}

              {/* Treemap View */}
              {viewMode === 'treemap' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <TreemapChart
                    data={buildHierarchicalData()}
                    onNodeClick={(node) => handleTaxonClick(node.id)}
                  />
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
