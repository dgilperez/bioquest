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

interface SunburstChartProps {
  data: TaxonNode;
  width?: number;
  height?: number;
  onNodeClick?: (node: TaxonNode) => void;
}

export function SunburstChart({
  data,
  width = 600,
  height = 600,
  onNodeClick,
}: SunburstChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const radius = Math.min(width, height) / 2;

    // Create hierarchy
    const root = d3.hierarchy(data, (d: any) => d.children)
      .sum((d: any) => d.userObsCount || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create partition layout
    const partition = d3.partition<TaxonNode>()
      .size([2 * Math.PI, radius]);

    partition(root as any);

    // Create arc generator
    const arc = d3.arc<any>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1 - 1);

    // Color scale based on depth
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto')
      .style('font', '12px sans-serif');

    // Create paths
    svg.append('g')
      .selectAll('path')
      .data((root as any).descendants().filter((d: any) => d.depth))
      .join('path')
      .attr('fill', (d: any) => {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr('fill-opacity', (d: any) =>
        arcVisible(d) ? (d.children ? 0.8 : 0.6) : 0
      )
      .attr('d', (d: any) => arc(d))
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: any) => {
        if (onNodeClick) {
          onNodeClick(d.data);
        }
      })
      .on('mouseenter', function(event: any, d: any) {
        d3.select(this)
          .attr('fill-opacity', 1);

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
          .attr('fill-opacity', (d: any) =>
            arcVisible(d) ? (d.children ? 0.8 : 0.6) : 0
          );

        tooltip.style('opacity', 0);
      });

    // Add labels
    svg.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data((root as any).descendants().filter((d: any) => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
      .join('text')
      .attr('fill-opacity', (d: any) => +labelVisible(d))
      .attr('transform', (d: any) => labelTransform(d))
      .text((d: any) => d.data.commonName || d.data.name);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'sunburst-tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Helper functions
    function arcVisible(d: any) {
      return d.y1 <= radius && d.y0 >= 0 && d.x1 > d.x0;
    }

    function labelVisible(d: any) {
      return d.y1 <= radius && d.y0 >= 0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d: any) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = (d.y0 + d.y1) / 2;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="w-full flex justify-center">
      <svg ref={svgRef} className="rounded-xl" />
    </div>
  );
}
