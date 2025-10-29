import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AdventureClient } from './page.client';

export const metadata: Metadata = {
  title: 'Adventure',
  description: 'Explore biodiversity and plan your next adventure',
};

// Iconic taxa IDs from iNaturalist
const ICONIC_TAXA_IDS = {
  Animalia: 1,       // Animals
  Plantae: 47126,    // Plants
  Fungi: 47170,      // Fungi
  Mollusca: 47115,   // Mollusks
  Arachnida: 47119,  // Arachnids
  Insecta: 47158,    // Insects
  Aves: 3,           // Birds
  Mammalia: 40151,   // Mammals
  Reptilia: 26036,   // Reptiles
  Amphibia: 20978,   // Amphibians
};

export default async function AdventurePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/signin');
  }

  // Get user's progress for iconic taxa
  const iconicTaxaProgress = await Promise.all(
    Object.entries(ICONIC_TAXA_IDS).map(async ([name, id]) => {
      // Get user's observations for this taxon (simplified - just count observations with this taxon)
      const observations = await prisma.observation.findMany({
        where: {
          userId: user.id,
          taxonId: id,
        },
        select: {
          id: true,
          taxonId: true,
        },
      });

      // Count unique species (simplified)
      const uniqueTaxonIds = new Set(observations.map(obs => obs.taxonId));

      // Get taxon node for global species count
      const taxonNode = await prisma.taxonNode.findUnique({
        where: { id },
        select: {
          rank: true,
          globalSpeciesCount: true,
        },
      });

      const totalSpeciesGlobal = taxonNode?.globalSpeciesCount || 100000; // Fallback estimate
      const speciesCount = uniqueTaxonIds.size;
      const completionPercent = totalSpeciesGlobal > 0 ? (speciesCount / totalSpeciesGlobal) * 100 : 0;

      return {
        id,
        name,
        rank: taxonNode?.rank || 'kingdom',
        speciesCount,
        observationCount: observations.length,
        completionPercent,
        totalSpeciesGlobal,
      };
    })
  );

  // Sort by most progress first
  iconicTaxaProgress.sort((a, b) => b.speciesCount - a.speciesCount);

  // Get active trips (planned and in_progress)
  const activeTrips = await prisma.trip.findMany({
    where: {
      userId: user.id,
      status: {
        in: ['planned', 'in_progress'],
      },
    },
    include: {
      place: {
        select: {
          displayName: true,
        },
      },
      targetSpecies: {
        select: {
          spotted: true,
        },
      },
    },
    orderBy: [
      {
        status: 'desc', // in_progress first
      },
      {
        plannedDate: 'asc',
      },
    ],
    take: 10,
  });

  // Transform trips to match client interface (convert Date to string)
  const transformedTrips = activeTrips.map(trip => ({
    ...trip,
    plannedDate: trip.plannedDate ? trip.plannedDate.toISOString() : null,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <AdventureClient
        iconicTaxaProgress={iconicTaxaProgress.slice(0, 6)} // Top 6 iconic taxa
        activeTrips={transformedTrips}
      />
    </div>
  );
}
