'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TaxonNode {
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  obsCount: number;
  userObsCount?: number;
  children?: TaxonNode[];
}

interface TreemapChartProps {
  data: TaxonNode;
  width?: number;
  height?: number;
  onNodeClick?: (node: TaxonNode) => void;
}

export function TreemapChart({
  data,
  width = 800,
  height = 600,
  onNodeClick,
}: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create hierarchy
    const root = d3.hierarchy(data, (d: any) => d.children)
      .sum((d: any) => d.userObsCount || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3.treemap<TaxonNode>()
      .size([width, height])
      .padding(1)
      .round(true);

    treemap(root as any);

    // Color scale based on depth
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto')
      .style('font', '12px sans-serif');

    // Create cells
    const cell = svg
      .selectAll('g')
      .data((root as any).leaves())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    cell.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => {
        let node = d;
        while (node.depth > 1) node = node.parent;
        return color(node.data.name);
      })
      .attr('fill-opacity', 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        if (onNodeClick) {
          onNodeClick(d.data);
        }
      })
      .on('mouseenter', function(event: any, d: any) {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 3);

        // Show tooltip
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.data.commonName || d.data.name}</strong><br/>
            <em>${d.data.rank}</em><br/>
            Your observations: ${d.data.userObsCount || 0}<br/>
            Total observations: ${d.data.obsCount}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', (event: any) => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('fill-opacity', 0.7)
          .attr('stroke-width', 2);

        tooltip.style('opacity', 0);
      });

    // Add labels
    cell.append('text')
      .attr('x', 3)
      .attr('y', 15)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)')
      .each(function(d: any) {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        const text = d.data.commonName || d.data.name;

        // Only show text if cell is large enough
        if (width > 60 && height > 25) {
          d3.select(this).text(text);

          // Truncate if too long
          const maxChars = Math.floor(width / 7);
          if (text.length > maxChars) {
            d3.select(this).text(text.slice(0, maxChars - 3) + '...');
          }
        }
      });

    // Add observation counts
    cell.append('text')
      .attr('x', 3)
      .attr('y', 30)
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)')
      .each(function(d: any) {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;

        // Only show count if cell is large enough
        if (width > 60 && height > 45) {
          d3.select(this).text(`${d.data.userObsCount || 0} obs`);
        }
      });

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'treemap-tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="w-full flex justify-center">
      <svg ref={svgRef} className="rounded-xl border-2 border-gray-200 dark:border-gray-700" />
    </div>
  );
}
