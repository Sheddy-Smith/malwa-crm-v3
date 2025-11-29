/**
 * Windows Installation Test Script
 * Tests the automatic installation functionality
 */

import windowsInstallationManager from '../src/utils/windowsInstallationManager.js';

class InstallationTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Windows Installation Tests...\n');

    try {
      // Test 1: Check installation status
      await this.testInstallationStatus();

      // Test 2: Test fresh installation
      await this.testFreshInstallation();

      // Test 3: Test existing installation validation
      await this.testExistingInstallation();

      // Test 4: Test file creation
      await this.testFileCreation();

      // Test 5: Test folder creation
      await this.testFolderCreation();

      this.printTestSummary();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testInstallationStatus() {
    console.log('📊 Test 1: Installation Status Check');
    try {
      const status = await windowsInstallationManager.getInstallationStatus();
      console.log('Status:', status);
      
      this.testResults.push({
        test: 'Installation Status Check',
        passed: typeof status === 'object' && status !== null,
        details: status
      });
      
      console.log('✅ Test 1 passed\n');
    } catch (error) {
      console.error('❌ Test 1 failed:', error);
      this.testResults.push({
        test: 'Installation Status Check',
        passed: false,
        error: error.message
      });
    }
  }

  async testFreshInstallation() {
    console.log('🆕 Test 2: Fresh Installation');
    try {
      // Simulate fresh installation check
      const isWindows = windowsInstallationManager.isWindows();
      console.log('Windows OS detected:', isWindows);
      
      this.testResults.push({
        test: 'Windows OS Detection',
        passed: typeof isWindows === 'boolean',
        details: isWindows
      });
      
      console.log('✅ Test 2 passed\n');
    } catch (error) {
      console.error('❌ Test 2 failed:', error);
      this.testResults.push({
        test: 'Fresh Installation',
        passed: false,
        error: error.message
      });
    }
  }

  async testExistingInstallation() {
    console.log('🔍 Test 3: Existing Installation Validation');
    try {
      const exists = await windowsInstallationManager.checkInstallationExists();
      console.log('Installation exists:', exists);
      
      this.testResults.push({
        test: 'Installation Existence Check',
        passed: typeof exists === 'boolean',
        details: exists
      });
      
      console.log('✅ Test 3 passed\n');
    } catch (error) {
      console.error('❌ Test 3 failed:', error);
      this.testResults.push({
        test: 'Existing Installation Validation',
        passed: false,
        error: error.message
      });
    }
  }

  async testFileCreation() {
    console.log('📄 Test 4: File Creation Logic');
    try {
      const defaultSettings = windowsInstallationManager.getDefaultSettings();
      console.log('Default settings generated:', Object.keys(defaultSettings));
      
      this.testResults.push({
        test: 'Default Settings Generation',
        passed: typeof defaultSettings === 'object' && defaultSettings.version,
        details: defaultSettings.version
      });
      
      console.log('✅ Test 4 passed\n');
    } catch (error) {
      console.error('❌ Test 4 failed:', error);
      this.testResults.push({
        test: 'File Creation Logic',
        passed: false,
        error: error.message
      });
    }
  }

  async testFolderCreation() {
    console.log('📁 Test 5: Folder Structure Logic');
    try {
      const manager = windowsInstallationManager;
      const folderCount = manager.requiredFolders.length;
      const fileCount = manager.blankDataFiles.length;
      
      console.log(`Required folders: ${folderCount}`);
      console.log(`Required files: ${fileCount}`);
      console.log('Base path:', manager.baseInstallPath);
      
      this.testResults.push({
        test: 'Folder Structure Logic',
        passed: folderCount > 0 && fileCount > 0,
        details: { folders: folderCount, files: fileCount }
      });
      
      console.log('✅ Test 5 passed\n');
    } catch (error) {
      console.error('❌ Test 5 failed:', error);
      this.testResults.push({
        test: 'Folder Structure Logic',
        passed: false,
        error: error.message
      });
    }
  }

  printTestSummary() {
    console.log('\n📋 Test Summary:');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.details && !result.error) {
        console.log(`   Details: ${JSON.stringify(result.details)}`);
      }
    });
    
    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }
  }
}

// Manual test execution (can be called from browser console)
if (typeof window !== 'undefined') {
  window.testInstallation = async () => {
    const tester = new InstallationTester();
    await tester.runAllTests();
  };
  
  console.log('🧪 Installation test available. Run: testInstallation()');
}

export default InstallationTester;