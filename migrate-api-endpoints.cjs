// API Endpoint Migration Script
// Migrates legacy Laravel API endpoints to FastAPI v1 structure

const fs = require('fs');
const path = require('path');

// Endpoint mapping rules: Laravel path -> FastAPI path
const ENDPOINT_MAPPINGS = {
    // User Management
    '/api/create-patient': '/users/patients',
    '/api/forgot-password': '/auth/forgot-password',
    '/api/get-users-details-for-update/': '/users/',
    '/api/get-all-users': '/users',
    '/api/get-doctors': '/doctors',
    '/api/get-patients-details': '/patients',
    '/api/get-pharmacist-patients-details': '/patients?role=pharmacist',
    '/api/get-cashier-patients-details': '/patients?role=cashier',

    // Appointments
    '/api/admin-create-patient-appointment': '/appointments',
    '/api/create-patient-appointment': '/appointments',
    '/api/get-patient-by-phone/': '/patients/phone/',
    '/api/get-patient-details/': '/patients/',
    '/api/create-doctor-schedule': '/schedules',
    '/api/check-doctor-availability-user': '/schedules/check-availability',

    // Pharmacy - Products
    '/api/create-product': '/pharmacy/products',
    '/api/get-products': '/pharmacy/products',
    '/api/get-product-item-name': '/pharmacy/products/names',
    '/api/pharmacist-get-product-item-name': '/pharmacy/products/names',
    '/api/pharmacist-user-create-product': '/pharmacy/products',
    '/api/update-product/': '/pharmacy/products/',
    '/api/pharmacist-user-get-products': '/pharmacy/products',
    '/api/cashier-user-get-products': '/pharmacy/products',

    // Pharmacy - Suppliers
    '/api/create-supplier': '/pharmacy/suppliers',
    '/api/get-suppliers': '/pharmacy/suppliers',
    '/api/get-pharmacist-suppliers': '/pharmacy/suppliers',
    '/api/create-pharmacist-supplier': '/pharmacy/suppliers',
    '/api/update-supplier/': '/pharmacy/suppliers/',

    // Pharmacy - Stock
    '/api/update-product-stock': '/pharmacy/stock/update',
    '/api/add-product-damaged-stock': '/pharmacy/stock/damaged',
    '/api/pharmacist-add-product-damaged-stock': '/pharmacy/stock/damaged',
    '/api/cashier-add-product-damaged-stock': '/pharmacy/stock/damaged',
    '/api/get-damaged-product': '/pharmacy/stock/damaged',
    '/api/pharmacist-get-damaged-product': '/pharmacy/stock/damaged',
    '/api/cashier-get-damaged-product': '/pharmacy/stock/damaged',
    '/api/add-product-transfer-stock': '/pharmacy/stock/transfer',
    '/api/pharmacist-add-product-transfer-stock': '/pharmacy/stock/transfer',
    '/api/cashier-add-product-transfer-stock': '/pharmacy/stock/transfer',
    '/api/get-transfer-product': '/pharmacy/stock/transfer',
    '/api/pharmacist-get-transfer-product': '/pharmacy/stock/transfer',
    '/api/cashier-get-transfer-product': '/pharmacy/stock/transfer',
    '/api/get-product-renewed-stock': '/pharmacy/stock/renewed',
    '/api/pharmacist-get-product-renewed-stock': '/pharmacy/stock/renewed',
    '/api/cashier-get-product-renewed-stock': '/pharmacy/stock/renewed',

    // Pharmacy - POS
    '/api/purchasing-product': '/pharmacy/pos/purchase',
    '/api/pharmacist-user-purchasing-product': '/pharmacy/pos/purchase',
    '/api/cashier-purchasing-product': '/pharmacy/pos/purchase',
    '/api/get-purchasing-products': '/pharmacy/pos/purchase',
    '/api/pharmacist-user-get-purchasing-products': '/pharmacy/pos/purchase',
    '/api/cashier-get-purchasing-products': '/pharmacy/pos/purchase',
    '/api/get-product-discount': '/pharmacy/pos/discounts',
    '/api/pharmacist-user-get-product-discount': '/pharmacy/pos/discounts',
    '/api/cashier-user-get-product-discount': '/pharmacy/pos/discounts',

    // Pharmacy - Dashboard
    '/api/dashboard-details': '/pharmacy/dashboard',
    '/api/pharmacist-user-dashboard-details': '/pharmacy/dashboard',
    '/api/cashier-dashboard-details': '/pharmacy/dashboard',

    // HR - Leave
    '/api/cashier-user-add-leave': '/hr/leave',
    '/api/pharmacist-user-add-leave': '/hr/leave',
    '/api/get-cashier-user-leaves/': '/hr/leave/user/',
    '/api/get-pharmacist-user-leaves/': '/hr/leave/user/',
    '/api/admin-user-leave-approve': '/hr/leave/approve',
    '/api/cashier-user-leave-approve': '/hr/leave/approve',
    '/api/pharmacist-user-leave-approve': '/hr/leave/approve',
    '/api/admin-user-leave-reject': '/hr/leave/reject',
    '/api/cashier-user-leave-reject': '/hr/leave/reject',
    '/api/pharmacist-user-leave-reject': '/hr/leave/reject',
    '/api/get-cashier-user-leaves-request/': '/hr/leave/requests/',
    '/api/get-pharmacist-user-leaves-request/': '/hr/leave/requests/',

    // HR - Salary
    '/api/create-staff-salary': '/hr/salary',
    '/api/get-all-staff-salary': '/hr/salary',
    '/api/get-all-staff-salary-pay': '/hr/salary/payments',
    '/api/get-all-staff-salary-pay-filter': '/hr/salary/payments',

    // HR - OT
    '/api/create-employee-ot': '/hr/overtime',
    '/api/get-all-employee-ot': '/hr/overtime',
    '/api/get-all-users-with-salary': '/hr/users/salary',

    // Shifts
    '/api/create-shift': '/hr/shifts',
    '/api/get-all-shifts': '/hr/shifts',

    // Schedule Management
    '/api/approve-cancel-schedule/': '/schedules/cancel/approve/',
    '/api/reject-cancel-schedule/': '/schedules/cancel/reject/',
};

// Generic patterns to handle (regex-based)
const GENERIC_PATTERNS = [
    { pattern: /\/api\/([^\/]+)/, replacement: '/$1' }, // Remove /api/ prefix for unmatched
];

class APIEndpointMigrator {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.stats = {
            filesScanned: 0,
            filesModified: 0,
            endpointsReplaced: 0,
            errors: [],
        };
    }

    log(message, level = 'info') {
        if (this.verbose || level === 'error') {
            const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
            console.log(`${prefix} ${message}`);
        }
    }

    findTsFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Skip node_modules and build directories
                if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
                    this.findTsFiles(filePath, fileList);
                }
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                fileList.push(filePath);
            }
        });

        return fileList;
    }

    migrateFile(filePath) {
        this.stats.filesScanned++;

        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            let replacementCount = 0;

            // Check if file uses axios directly
            if (content.includes('import axios from "axios"') || content.includes("import axios from 'axios'")) {

                // Step 1: Replace axios import with api import
                const relativePath = this.calculateRelativePath(filePath);
                content = content.replace(
                    /import axios from ["']axios["'];?/g,
                    `import api from "${relativePath}";`
                );
                modified = true;
                this.log(`  → Replaced axios import in ${path.basename(filePath)}`);

                // Step 2: Replace axios.get/post/put/delete with api.get/post/put/delete
                content = content.replace(/\baxios\.(get|post|put|delete|patch)\(/g, 'api.$1(');

                // Step 3: Replace endpoint paths
                for (const [oldPath, newPath] of Object.entries(ENDPOINT_MAPPINGS)) {
                    const oldPathEscaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // Handle both quoted strings and template literals
                    const patterns = [
                        new RegExp(`["']\\/api\\/${oldPath.replace('/api/', '')}["']`, 'g'),
                        new RegExp(`["']${oldPathEscaped}["']`, 'g'),
                        new RegExp('`' + oldPathEscaped, 'g'),
                    ];

                    patterns.forEach(pattern => {
                        const matches = content.match(pattern);
                        if (matches) {
                            replacementCount += matches.length;
                            content = content.replace(pattern, (match) => {
                                const quote = match[0];
                                return quote + newPath + (quote === '`' ? '' : quote);
                            });
                        }
                    });
                }

                // Step 4: Apply generic patterns for remaining /api/ prefixes
                const remainingApiPattern = /(['"`])\/api\/([^'"`]+)\1/g;
                content = content.replace(remainingApiPattern, (match, quote, endpoint) => {
                    // Only replace if not already /api/v1/
                    if (endpoint.startsWith('v1/')) {
                        return match;
                    }
                    replacementCount++;
                    return `${quote}/${endpoint}${quote}`;
                });

                this.stats.endpointsReplaced += replacementCount;
            }

            // Write file if modified and not in dry-run mode
            if (modified) {
                this.stats.filesModified++;

                if (!this.dryRun) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    this.log(`✅ Migrated: ${filePath} (${replacementCount} endpoints)`, 'success');
                } else {
                    this.log(`🔍 Would migrate: ${filePath} (${replacementCount} endpoints)`);
                }
            }

        } catch (error) {
            this.stats.errors.push({ file: filePath, error: error.message });
            this.log(`Error processing ${filePath}: ${error.message}`, 'error');
        }
    }

    calculateRelativePath(filePath) {
        // Calculate relative path from file to utils/api/axios
        const fileDir = path.dirname(filePath);
        const apiPath = path.join(process.cwd(), 'frontend', 'src', 'utils', 'api', 'axios');

        let relativePath = path.relative(fileDir, apiPath);
        // Normalize to Unix-style paths for imports
        relativePath = relativePath.split(path.sep).join('/');

        // Ensure it starts with ./
        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }

        return relativePath;
    }

    async migrate(targetDir) {
        console.log('🚀 Starting API Endpoint Migration...\n');
        console.log(`Mode: ${this.dryRun ? 'DRY RUN (preview only)' : 'LIVE MIGRATION'}`);
        console.log(`Target: ${targetDir}\n`);

        const files = this.findTsFiles(targetDir);
        console.log(`Found ${files.length} TypeScript files to scan\n`);

        files.forEach(file => this.migrateFile(file));

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Files scanned:       ${this.stats.filesScanned}`);
        console.log(`Files modified:      ${this.stats.filesModified}`);
        console.log(`Endpoints replaced:  ${this.stats.endpointsReplaced}`);
        console.log(`Errors:              ${this.stats.errors.length}`);

        if (this.stats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.stats.errors.forEach(({ file, error }) => {
                console.log(`  - ${file}: ${error}`);
            });
        }

        if (this.dryRun) {
            console.log('\n⚠️  DRY RUN MODE - No files were actually modified');
            console.log('Run with --live to apply changes');
        } else {
            console.log('\n✅ Migration complete!');
        }
        console.log('='.repeat(60));
    }
}

// CLI Interface
const args = process.argv.slice(2);
const options = {
    dryRun: !args.includes('--live'),
    verbose: args.includes('--verbose') || args.includes('-v'),
};

const targetDir = path.join(__dirname, 'frontend', 'src');
const migrator = new APIEndpointMigrator(options);
migrator.migrate(targetDir);
