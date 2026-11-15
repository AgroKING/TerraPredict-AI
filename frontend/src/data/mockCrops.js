export const MOCK_CROPS = [
    {
        id: 'winter-wheat',
        name: 'Winter Wheat',
        scientificName: 'Triticum aestivum',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
        feasibilityScore: 94,
        metrics: {
            waterNeed: '450 mm',
            growthCycle: '120 Days',
            soilTemp: '12°C – 22°C',
            ndviMatch: 'Optimal'
        },
        expandedDetails: {
            rotationBenefit: 'High biomass residue improves topsoil moisture retention before summer legumes.',
            nitrogenImpact: '-35 kg/ha (Follow with Nitrogen fixer)',
            sowingWindow: 'Mid-Nov to Dec'
        }
    },
    {
        id: 'chickpea',
        name: 'Chickpea (Kabuli)',
        scientificName: 'Cicer arietinum',
        image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80',
        feasibilityScore: 89,
        metrics: {
            waterNeed: '320 mm',
            growthCycle: '95 Days',
            soilTemp: '15°C – 26°C',
            ndviMatch: 'High'
        },
        expandedDetails: {
            rotationBenefit: 'Fixes atmospheric nitrogen via root nodules, replenishing depleted cereal plots.',
            nitrogenImpact: '+45 kg/ha (Net soil gain)',
            sowingWindow: 'Late Oct to Nov'
        }
    },
    {
        id: 'mustard',
        name: 'Indian Mustard',
        scientificName: 'Brassica juncea',
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
        feasibilityScore: 82,
        metrics: {
            waterNeed: '280 mm',
            growthCycle: '105 Days',
            soilTemp: '14°C – 25°C',
            ndviMatch: 'Moderate-High'
        },
        expandedDetails: {
            rotationBenefit: 'Deep taproot breaks up compacted subsoil layers and suppresses soil-borne pathogens.',
            nitrogenImpact: '-20 kg/ha',
            sowingWindow: 'Oct to Mid-Nov'
        }
    },
    {
        id: 'barley',
        name: 'Malting Barley',
        scientificName: 'Hordeum vulgare',
        image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80',
        feasibilityScore: 76,
        metrics: {
            waterNeed: '360 mm',
            growthCycle: '110 Days',
            soilTemp: '10°C – 20°C',
            ndviMatch: 'Good'
        },
        expandedDetails: {
            rotationBenefit: 'High salinity tolerance makes it ideal for transitioning marginal irrigated zones.',
            nitrogenImpact: '-28 kg/ha',
            sowingWindow: 'Nov to Early Dec'
        }
    }
];