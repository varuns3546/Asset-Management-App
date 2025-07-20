require('dotenv').config();
const supabase = require('./config/supabase');

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Test table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Table structure test failed:', tableError.message);
      return false;
    }
    
    console.log('✅ Users table is accessible!');
    console.log('🎉 Migration test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testConnection().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});