require('dotenv').config();
const mongoose   = require('mongoose');
const University = require('../models/University');

const universities = [
  // Florida
  { name: 'University of Central Florida',          abbreviation: 'UCF',   city: 'Orlando',        state: 'FL', domain: 'ucf.edu',          coordinates: { type: 'Point', coordinates: [-81.2003, 28.6024] } },
  { name: 'University of Florida',                  abbreviation: 'UF',    city: 'Gainesville',    state: 'FL', domain: 'ufl.edu',          coordinates: { type: 'Point', coordinates: [-82.3487, 29.6516] } },
  { name: 'Florida State University',               abbreviation: 'FSU',   city: 'Tallahassee',    state: 'FL', domain: 'fsu.edu',          coordinates: { type: 'Point', coordinates: [-84.2984, 30.4421] } },
  { name: 'University of Miami',                    abbreviation: 'UM',    city: 'Coral Gables',   state: 'FL', domain: 'miami.edu',        coordinates: { type: 'Point', coordinates: [-80.2786, 25.7211] } },
  { name: 'Florida International University',       abbreviation: 'FIU',   city: 'Miami',          state: 'FL', domain: 'fiu.edu',          coordinates: { type: 'Point', coordinates: [-80.3754, 25.7568] } },
  { name: 'University of South Florida',            abbreviation: 'USF',   city: 'Tampa',          state: 'FL', domain: 'usf.edu',          coordinates: { type: 'Point', coordinates: [-82.4140, 28.0587] } },
  { name: 'Florida Atlantic University',            abbreviation: 'FAU',   city: 'Boca Raton',     state: 'FL', domain: 'fau.edu',          coordinates: { type: 'Point', coordinates: [-80.1020, 26.3762] } },

  // New York
  { name: 'New York University',                    abbreviation: 'NYU',   city: 'New York',       state: 'NY', domain: 'nyu.edu',          coordinates: { type: 'Point', coordinates: [-73.9965, 40.7295] } },
  { name: 'Columbia University',                    abbreviation: 'CU',    city: 'New York',       state: 'NY', domain: 'columbia.edu',     coordinates: { type: 'Point', coordinates: [-73.9626, 40.8075] } },
  { name: 'Cornell University',                     abbreviation: 'Cornell', city: 'Ithaca',       state: 'NY', domain: 'cornell.edu',      coordinates: { type: 'Point', coordinates: [-76.4735, 42.4534] } },

  // California
  { name: 'University of California Los Angeles',   abbreviation: 'UCLA',  city: 'Los Angeles',    state: 'CA', domain: 'ucla.edu',         coordinates: { type: 'Point', coordinates: [-118.4452, 34.0689] } },
  { name: 'University of Southern California',      abbreviation: 'USC',   city: 'Los Angeles',    state: 'CA', domain: 'usc.edu',          coordinates: { type: 'Point', coordinates: [-118.2851, 34.0224] } },
  { name: 'University of California Berkeley',      abbreviation: 'UCB',   city: 'Berkeley',       state: 'CA', domain: 'berkeley.edu',     coordinates: { type: 'Point', coordinates: [-122.2595, 37.8724] } },
  { name: 'Stanford University',                    abbreviation: 'Stanford', city: 'Stanford',    state: 'CA', domain: 'stanford.edu',     coordinates: { type: 'Point', coordinates: [-122.1697, 37.4275] } },
  { name: 'San Diego State University',             abbreviation: 'SDSU',  city: 'San Diego',      state: 'CA', domain: 'sdsu.edu',         coordinates: { type: 'Point', coordinates: [-117.0712, 32.7757] } },

  // Texas
  { name: 'University of Texas at Austin',          abbreviation: 'UT',    city: 'Austin',         state: 'TX', domain: 'utexas.edu',       coordinates: { type: 'Point', coordinates: [-97.7385, 30.2849] } },
  { name: 'Texas A&M University',                   abbreviation: 'TAMU',  city: 'College Station', state: 'TX', domain: 'tamu.edu',        coordinates: { type: 'Point', coordinates: [-96.3403, 30.6180] } },
  { name: 'Rice University',                        abbreviation: 'Rice',  city: 'Houston',        state: 'TX', domain: 'rice.edu',         coordinates: { type: 'Point', coordinates: [-95.4018, 29.7174] } },

  // Other major states
  { name: 'Harvard University',                     abbreviation: 'Harvard', city: 'Cambridge',    state: 'MA', domain: 'harvard.edu',      coordinates: { type: 'Point', coordinates: [-71.1167, 42.3770] } },
  { name: 'Massachusetts Institute of Technology',  abbreviation: 'MIT',   city: 'Cambridge',      state: 'MA', domain: 'mit.edu',          coordinates: { type: 'Point', coordinates: [-71.0921, 42.3601] } },
  { name: 'Boston University',                      abbreviation: 'BU',    city: 'Boston',         state: 'MA', domain: 'bu.edu',           coordinates: { type: 'Point', coordinates: [-71.1055, 42.3505] } },
  { name: 'University of Michigan',                 abbreviation: 'UMich', city: 'Ann Arbor',      state: 'MI', domain: 'umich.edu',        coordinates: { type: 'Point', coordinates: [-83.7382, 42.2780] } },
  { name: 'Ohio State University',                  abbreviation: 'OSU',   city: 'Columbus',       state: 'OH', domain: 'osu.edu',          coordinates: { type: 'Point', coordinates: [-83.0298, 40.0076] } },
  { name: 'Georgia Tech',                           abbreviation: 'GT',    city: 'Atlanta',        state: 'GA', domain: 'gatech.edu',       coordinates: { type: 'Point', coordinates: [-84.3963, 33.7756] } },
  { name: 'University of Georgia',                  abbreviation: 'UGA',   city: 'Athens',         state: 'GA', domain: 'uga.edu',          coordinates: { type: 'Point', coordinates: [-83.3777, 33.9480] } },
  { name: 'University of North Carolina',           abbreviation: 'UNC',   city: 'Chapel Hill',    state: 'NC', domain: 'unc.edu',          coordinates: { type: 'Point', coordinates: [-79.0519, 35.9049] } },
  { name: 'Duke University',                        abbreviation: 'Duke',  city: 'Durham',         state: 'NC', domain: 'duke.edu',         coordinates: { type: 'Point', coordinates: [-78.9382, 36.0014] } },
  { name: 'University of Washington',               abbreviation: 'UW',    city: 'Seattle',        state: 'WA', domain: 'uw.edu',           coordinates: { type: 'Point', coordinates: [-122.3035, 47.6553] } },
  { name: 'University of Illinois Urbana-Champaign', abbreviation: 'UIUC', city: 'Champaign',      state: 'IL', domain: 'illinois.edu',     coordinates: { type: 'Point', coordinates: [-88.2272, 40.1020] } },
  { name: 'Northwestern University',                abbreviation: 'NU',    city: 'Evanston',       state: 'IL', domain: 'northwestern.edu', coordinates: { type: 'Point', coordinates: [-87.6763, 42.0565] } },
  { name: 'University of Chicago',                  abbreviation: 'UChicago', city: 'Chicago',     state: 'IL', domain: 'uchicago.edu',     coordinates: { type: 'Point', coordinates: [-87.5987, 41.7886] } },
  { name: 'Penn State University',                  abbreviation: 'PSU',   city: 'State College',  state: 'PA', domain: 'psu.edu',          coordinates: { type: 'Point', coordinates: [-77.8599, 40.7982] } },
  { name: 'University of Pennsylvania',             abbreviation: 'UPenn', city: 'Philadelphia',   state: 'PA', domain: 'upenn.edu',        coordinates: { type: 'Point', coordinates: [-75.1932, 39.9522] } },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await University.deleteMany({});
    console.log('Cleared existing universities');

    await University.insertMany(universities);
    console.log(`✅ Seeded ${universities.length} universities`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
