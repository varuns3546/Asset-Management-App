import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const sourceProjectId = 'a1ecc77b-8bf7-47c9-865b-083e253754b3';
const targetProjectId = 'f12c5a15-cc05-4381-8584-20f77d6b15cf'; // clone4

async function verifyClone() {
  console.log('='.repeat(80));
  console.log('CLONE VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`Source Project: ${sourceProjectId}`);
  console.log(`Target Project: ${targetProjectId}`);
  console.log('='.repeat(80));
  console.log();

  const tables = [
    'asset_types',
    'attributes',
    'assets',
    'gis_layers',
    'gis_features',
    'leaflet_shapes',
    'project_files',
    'attribute_values'
  ];

  const results = [];

  for (const table of tables) {
    try {
      // Get source count
      const { count: sourceCount, error: sourceError } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('project_id', sourceProjectId);

      if (sourceError) {
        console.error(`Error querying ${table} (source):`, sourceError);
        results.push({ table, sourceCount: 0, targetCount: 0, status: 'ERROR', error: sourceError.message });
        continue;
      }

      // Get target count
      const { count: targetCount, error: targetError } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('project_id', targetProjectId);

      if (targetError) {
        console.error(`Error querying ${table} (target):`, targetError);
        results.push({ table, sourceCount: sourceCount || 0, targetCount: 0, status: 'ERROR', error: targetError.message });
        continue;
      }

      const status = sourceCount === targetCount ? '✓ MATCH' : '✗ MISMATCH';
      results.push({ table, sourceCount: sourceCount || 0, targetCount: targetCount || 0, status });

    } catch (error) {
      console.error(`Error processing ${table}:`, error);
      results.push({ table, sourceCount: 0, targetCount: 0, status: 'ERROR', error: error.message });
    }
  }

  // Print results table
  console.log('TABLE'.padEnd(25) + 'SOURCE'.padEnd(12) + 'TARGET'.padEnd(12) + 'STATUS');
  console.log('-'.repeat(80));
  
  for (const result of results) {
    const tableName = result.table.padEnd(25);
    const sourceCount = String(result.sourceCount).padEnd(12);
    const targetCount = String(result.targetCount).padEnd(12);
    const status = result.status;
    
    console.log(`${tableName}${sourceCount}${targetCount}${status}`);
    
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log();
  console.log('='.repeat(80));
  
  // Summary
  const matched = results.filter(r => r.status === '✓ MATCH').length;
  const mismatched = results.filter(r => r.status === '✗ MISMATCH').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`Summary: ${matched} matched, ${mismatched} mismatched, ${errors} errors`);
  console.log('='.repeat(80));

  // If there are mismatches, show details
  if (mismatched > 0 || errors > 0) {
    console.log('\nDetailed comparison:');
    console.log('-'.repeat(80));
    
    for (const result of results) {
      if (result.status !== '✓ MATCH') {
        console.log(`\n${result.table.toUpperCase()}:`);
        console.log(`  Source: ${result.sourceCount} records`);
        console.log(`  Target: ${result.targetCount} records`);
        
        if (result.status === '✗ MISMATCH') {
          const diff = result.sourceCount - result.targetCount;
          console.log(`  Difference: ${diff > 0 ? '+' : ''}${diff} records`);
        }
      }
    }
  }
}

verifyClone().catch(console.error);

