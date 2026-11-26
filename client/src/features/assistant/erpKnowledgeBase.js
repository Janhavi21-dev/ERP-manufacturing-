// Comprehensive ERP Knowledge Base & Intent Resolution Engine

export const ERP_PAGES = [
  { name: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'home', 'overview', 'summary', 'metrics', 'stats'] },
  { name: 'Products', path: '/products', keywords: ['product', 'item', 'raw material', 'finished good', 'sku', 'catalog', 'parts'] },
  { name: 'Categories', path: '/categories', keywords: ['category', 'categories', 'classification', 'grouping'] },
  { name: 'Units of Measure', path: '/units', keywords: ['unit', 'uom', 'measurement', 'kg', 'pcs', 'meter', 'liter'] },
  { name: 'Warehouses', path: '/warehouses', keywords: ['warehouse', 'storage', 'location', 'bin', 'rack', 'facility'] },
  { name: 'Suppliers', path: '/suppliers', keywords: ['supplier', 'vendor', 'procurement partner', 'seller'] },
  { name: 'Customers', path: '/customers', keywords: ['customer', 'client', 'buyer', 'distributor'] },
  { name: 'Stock Overview', path: '/inventory', keywords: ['stock', 'inventory', 'on hand', 'available stock', 'balance', 'quantities'] },
  { name: 'Stock Movements', path: '/inventory/movements', keywords: ['stock movements', 'movement ledger', 'transactions', 'audit movements', 'history'] },
  { name: 'Stock Adjustments', path: '/inventory/adjustments', keywords: ['adjustment', 'cycle count', 'stock count', 'write off', 'discrepancy'] },
  { name: 'Reorder Alerts', path: '/inventory/alerts', keywords: ['reorder', 'alert', 'low stock', 'threshold', 'replenish'] },
  { name: 'Purchase Requisitions', path: '/procurement/requisitions', keywords: ['requisition', 'purchase request', 'indent', 'req'] },
  { name: 'Purchase Orders', path: '/procurement/orders', keywords: ['purchase order', 'po', 'buy', 'vendor order'] },
  { name: 'Goods Receipts', path: '/procurement/receipts', keywords: ['goods receipt', 'grn', 'receiving', 'received items', 'dock receipt'] },
  { name: 'Bill of Materials (BOM)', path: '/production/boms', keywords: ['bom', 'bill of materials', 'formula', 'recipe', 'assembly', 'components'] },
  { name: 'Work Orders', path: '/production/work-orders', keywords: ['work order', 'job card', 'production order', 'manufacturing', 'shop floor', 'assembly line'] },
  { name: 'Quality Inspections', path: '/quality', keywords: ['quality', 'inspection', 'qa', 'qc', 'qc check', 'testing', 'ncr', 'defect'] },
  { name: 'Sales Orders', path: '/sales/orders', keywords: ['sales order', 'so', 'customer order', 'quotation'] },
  { name: 'Dispatches', path: '/sales/dispatches', keywords: ['dispatch', 'shipping', 'delivery', 'fulfill', 'shipment'] },
  { name: 'Commercial Invoices', path: '/invoices', keywords: ['invoice', 'billing', 'bill', 'pdf invoice', 'commercial invoice'] },
  { name: 'Payments', path: '/payments', keywords: ['payment', 'receipt', 'accounts receivable', 'cash', 'bank transfer'] },
  { name: 'Expenses', path: '/expenses', keywords: ['expense', 'operational cost', 'spending', 'overhead', 'costs'] },
  { name: 'Reports', path: '/reports', keywords: ['report', 'analytics', 'export', 'financials', 'summary'] },
  { name: 'User Management', path: '/users', keywords: ['user', 'employee', 'staff', 'operator', 'roles', 'permissions', 'account'] },
  { name: 'Audit Logs', path: '/audit-logs', keywords: ['audit', 'logs', 'security', 'activity', 'tracking', 'history'] },
  { name: 'My Profile', path: '/profile', keywords: ['profile', 'account settings', 'password', 'me'] },
];

export const FREQUENT_TOPICS = [
  {
    title: '📦 How to Receive Goods (GRN)',
    query: 'How do I receive purchased goods and increase inventory?',
  },
  {
    title: '⚙️ Creating a Work Order',
    query: 'How to create and execute a production work order?',
  },
  {
    title: '📋 Creating a Bill of Materials',
    query: 'How do I build a BOM for my product?',
  },
  {
    title: '🔔 Checking Low Stock Alerts',
    query: 'Where can I see items that are below minimum reorder level?',
  },
  {
    title: '🚚 Dispatching Sales Orders',
    query: 'How does dispatching work and how does it update inventory?',
  },
  {
    title: '📑 Generating Invoices & PDFs',
    query: 'How to generate and download a commercial invoice PDF?',
  },
  {
    title: '⚖️ Making Stock Adjustments',
    query: 'How do I adjust stock count if there is physical damage or loss?',
  },
];

export const KNOWLEDGE_ARTICLES = [
  {
    id: 'grn_receiving',
    keywords: ['receive goods', 'goods receipt', 'grn', 'receiving', 'vendor delivery', 'po receipt', 'purchase receipt'],
    title: 'Receiving Purchased Goods (Goods Receipt)',
    content: `When ordered goods arrive at your warehouse, use the **Goods Receipts** module to register incoming delivery:
1. Navigate to **Procurement → Goods Receipts**.
2. Click **"+ New Goods Receipt"**.
3. Select the approved **Purchase Order** and the receiving **Warehouse**.
4. Enter the received quantities for each item and vendor delivery note / challan reference.
5. Save the receipt. The system automatically creates immutable **Stock Movement Ledger** records and increments your available warehouse inventory.`,
    link: { text: 'Go to Goods Receipts', path: '/procurement/receipts' },
    related: ['How do I check current inventory?', 'How to create a purchase order?'],
  },
  {
    id: 'work_order_workflow',
    keywords: ['create work order', 'execute work order', 'production', 'job card', 'assemble', 'manufacturing process', 'issue material'],
    title: 'Production Work Order Lifecycle',
    content: `Manufacturing items follows a 5-step lifecycle:
1. **Create Work Order**: Head to **Production → Work Orders**, click **"+ New Work Order"**, select your Finished Good and active BOM.
2. **Release**: Transition order from *Planned* to *Released* status.
3. **Issue Materials**: Click **"Issue Materials"** to deduct required raw materials from warehouse stock ledger according to the BOM formula.
4. **Report Progress**: Record manufactured quantity and any process scrap.
5. **Complete**: When finished, completing the work order adds the finished goods directly into your destination warehouse stock!`,
    link: { text: 'Open Work Orders', path: '/production/work-orders' },
    related: ['How do I build a BOM?', 'How does quality inspection work?'],
  },
  {
    id: 'bom_creation',
    keywords: ['bom', 'bill of materials', 'formula', 'components', 'recipe', 'assembly structure'],
    title: 'Creating a Bill of Materials (BOM)',
    content: `A Bill of Materials (BOM) specifies the exact components required to manufacture one unit of a finished product:
1. Go to **Production → Bill of Materials (BOM)**.
2. Click **"+ New BOM"**.
3. Choose the parent Finished Good or Semi-Finished product.
4. Add line items: specify each Raw Material component, required quantity per unit, and scrap percentage tolerance.
5. Set revision code (e.g. *Rev A*) and click Save. This BOM is now available when launching Work Orders!`,
    link: { text: 'Open BOM Management', path: '/production/boms' },
    related: ['How to create a work order?', 'How to add a new product?'],
  },
  {
    id: 'stock_alerts',
    keywords: ['low stock', 'reorder alert', 'reorder level', 'minimum quantity', 'stock alert', 'out of stock'],
    title: 'Monitoring Low Stock & Reorder Alerts',
    content: `Never run out of critical raw materials or fast-moving goods:
1. Go to **Inventory → Reorder Alerts**.
2. The system compares current available warehouse stock with each product's configured **Minimum Reorder Level**.
3. Items shown with a red badge are currently at or below their reorder point.
4. You can directly raise a **Purchase Requisition** or **Purchase Order** from this view to replenish inventory before stockout happens.`,
    link: { text: 'View Reorder Alerts', path: '/inventory/alerts' },
    related: ['How to check stock overview?', 'How to create a purchase order?'],
  },
  {
    id: 'stock_adjustment',
    keywords: ['adjust stock', 'stock adjustment', 'cycle count', 'damaged stock', 'scrap stock', 'discrepancy', 'inventory difference'],
    title: 'Adjusting Stock Balances',
    content: `To reconcile discrepancies between physical warehouse counts and system numbers:
1. Navigate to **Inventory → Stock Adjustments**.
2. Click **"+ New Adjustment"**.
3. Pick the target Warehouse and Product.
4. Select whether it is an **Addition** (surplus found) or **Reduction** (damage, shrinkage, expiration).
5. Specify the adjusted quantity and reason note (e.g. "Annual Physical Audit").
6. Submitting automatically posts a balancing ledger entry with full audit trail!`,
    link: { text: 'Go to Stock Adjustments', path: '/inventory/adjustments' },
    related: ['How to view stock ledger movements?', 'How to check warehouse stock?'],
  },
  {
    id: 'dispatch_flow',
    keywords: ['dispatch', 'delivery', 'shipping', 'fulfill order', 'sales delivery', 'shipment'],
    title: 'Dispatching Customer Orders',
    content: `When goods are ready to be shipped out to a customer:
1. Ensure the **Sales Order** is in *Approved* status under **Sales → Sales Orders**.
2. Go to **Sales → Dispatches** and click **"+ New Dispatch"**.
3. Select the Sales Order; verify shipping address and items.
4. Click **Confirm Dispatch**.
5. The system immediately decrements finished goods stock in the warehouse ledger and marks the Sales Order as *Fulfilled* or *Partially Fulfilled*.`,
    link: { text: 'Open Dispatches', path: '/sales/dispatches' },
    related: ['How to create a commercial invoice?', 'How to view sales orders?'],
  },
  {
    id: 'invoice_pdf',
    keywords: ['invoice', 'pdf invoice', 'commercial invoice', 'billing', 'accounts receivable', 'download invoice'],
    title: 'Generating & Downloading Commercial Invoices',
    content: `To bill a customer and generate PDF invoices:
1. Head over to **Finance → Invoices**.
2. Click **"+ Create Invoice"** and attach the relevant customer and sales order.
3. Review line items, tax rates, payment terms, and due date.
4. Once saved or posted, click the **"Download PDF"** button next to any invoice to instantly get a professional branded **Manufacturing ERP Commercial Invoice PDF**!`,
    link: { text: 'Open Invoices', path: '/invoices' },
    related: ['How to record a payment?', 'How to dispatch goods?'],
  },
  {
    id: 'payments',
    keywords: ['record payment', 'customer payment', 'collect payment', 'cash payment', 'bank transfer', 'settle invoice'],
    title: 'Recording Customer Payments',
    content: `To settle outstanding invoice balances:
1. Go to **Finance → Payments**.
2. Click **"+ Record Payment"**.
3. Select the Customer and the specific unpaid or partially paid Invoice.
4. Enter payment amount, payment method (Bank Wire, Check, Cash, Card), and reference transaction number.
5. The invoice status will update automatically to *Paid* or *Partially Paid*, adjusting Accounts Receivable.`,
    link: { text: 'Go to Payments', path: '/payments' },
    related: ['How to generate an invoice?', 'Where are financial reports?'],
  },
  {
    id: 'product_creation',
    keywords: ['create product', 'add product', 'new product', 'sku', 'raw material product', 'finished good product'],
    title: 'Adding Products to Master Data',
    content: `To define items in your master catalog:
1. Navigate to **Master Data → Products**.
2. Click **"+ Add Product"**.
3. Fill in details:
   - **SKU Code**: Unique product identifier (e.g. *RAW-STL-001*).
   - **Type**: Select *Raw Material*, *Semi-Finished*, *Finished Good*, *Consumable*, or *Spare Part*.
   - **Category & UOM**: Assign category and standard measurement (PCS, KG, M, L).
   - **Reorder Level**: Minimum stock threshold to trigger automated replenishment alerts.
4. Click Save. The product can now be stocked, purchased, or added to BOMs!`,
    link: { text: 'Open Products Catalog', path: '/products' },
    related: ['How to create a BOM?', 'How to set up Warehouses?'],
  },
  {
    id: 'quality_ncr',
    keywords: ['quality', 'inspection', 'qc', 'defect', 'ncr', 'nonconformance', 'reject', 'pass fail'],
    title: 'Quality Inspections & Nonconformance (NCR)',
    content: `Maintain ISO-standard manufacturing quality:
1. Go to **Quality Control**.
2. Run inspections for **Incoming Materials**, **In-Process Assemblies**, or **Finished Goods**.
3. Record sample sizes, tested parameters, and mark items as *Passed*, *Failed*, or *Conditionally Accepted*.
4. If an item fails inspection, create a **Nonconformance Report (NCR)** to document the root cause and assign disposition (Rework, Scrap, or Return to Vendor).`,
    link: { text: 'Open Quality Control', path: '/quality' },
    related: ['How to execute a work order?', 'How to receive goods?'],
  },
  {
    id: 'roles_permissions',
    keywords: ['user role', 'permissions', 'super admin', 'access control', 'rbac', 'add user', 'operator'],
    title: 'User Roles & Access Control (RBAC)',
    content: `Manufacturing ERP enforces role-based separation of duties:
- **Super Admin**: Full unrestricted access across all modules, user administration, and system settings.
- **Production Manager**: BOM management, Work Orders creation, material issue authorization.
- **Inventory Manager**: Warehouse master, stock ledger, stock adjustments, transfers.
- **Procurement Officer**: Supplier master, Purchase Orders, Goods Receiving.
- **Sales Manager**: Customers, Sales Orders, Dispatches, Invoicing.
- **Quality Inspector**: Quality inspections, testing checklists, NCR dispositions.
- **Accountant**: Invoices, payments, expense vouchers, financial reporting.
- **Employee / Operator**: Shop-floor work order reporting.

To manage users and assign roles, navigate to **Administration → Users**.`,
    link: { text: 'Manage Users & Roles', path: '/users' },
    related: ['How to check audit logs?', 'How to change company settings?'],
  },
  {
    id: 'audit_logs',
    keywords: ['audit log', 'security log', 'who did what', 'track changes', 'history of action'],
    title: 'System Audit Logs & Traceability',
    content: `Every significant business event (logins, stock movements, approvals, PO creations, deletions) is captured with full traceability:
1. Open **Administration → Audit Logs**.
2. View user name, timestamp, action type, IP address, and changed details.
3. Filter by date or module (Auth, Inventory, Procurement, Production, Sales, Finance).`,
    link: { text: 'View Audit Logs', path: '/audit-logs' },
    related: ['How to manage user accounts?', 'Where are low stock alerts?'],
  },
];

/**
 * Intelligent query processor for ERP queries
 */
export function processAssistantQuery(userInput, currentPath = '') {
  const query = userInput.trim().toLowerCase();

  // 1. Check for direct navigation requests ("go to...", "open...", "take me to...", "show...")
  const navTrigger = ['go to', 'open', 'show', 'take me to', 'navigate to', 'view', 'visit'];
  const isNav = navTrigger.some((t) => query.startsWith(t)) || query.includes('page') || query.includes('screen');

  for (const page of ERP_PAGES) {
    if (page.keywords.some((kw) => query.includes(kw))) {
      if (isNav || query.startsWith(page.name.toLowerCase())) {
        return {
          title: `Navigation: ${page.name}`,
          content: `Here is a direct shortcut to the **${page.name}** module. Click the link below to go there immediately:`,
          link: { text: `Open ${page.name} (${page.path})`, path: page.path },
          suggestions: [
            `What can I do on the ${page.name} page?`,
            'Show me other main modules',
          ],
        };
      }
    }
  }

  // 2. Score knowledge base articles
  let bestMatch = null;
  let highestScore = 0;

  for (const article of KNOWLEDGE_ARTICLES) {
    let score = 0;
    for (const kw of article.keywords) {
      if (query.includes(kw)) {
        score += kw.length * 2; // longer matches count more
      }
    }
    if (query.includes(article.id.replace('_', ' '))) {
      score += 10;
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = article;
    }
  }

  if (bestMatch && highestScore >= 4) {
    return {
      title: bestMatch.title,
      content: bestMatch.content,
      link: bestMatch.link,
      suggestions: bestMatch.related,
    };
  }

  // 3. Current page contextual guidance
  if (query.includes('current page') || query.includes('where am i') || query.includes('help here') || query.includes('this page')) {
    const matchedCurrent = ERP_PAGES.find((p) => p.path === currentPath);
    if (matchedCurrent) {
      return {
        title: `Help for ${matchedCurrent.name}`,
        content: `You are currently on the **${matchedCurrent.name}** screen (*${matchedCurrent.path}*).\n\nFrom here, you can manage and review related records for this department. Use the filters, search bars, and action buttons at the top of the table to add or modify data.`,
        link: { text: `Reload ${matchedCurrent.name}`, path: matchedCurrent.path },
        suggestions: ['How to receive goods?', 'How to create a work order?', 'Show stock alerts'],
      };
    }
  }

  // 4. General system help / Greeting
  if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('who are you')) {
    return {
      title: '👋 Welcome to Manufacturing ERP Assistant',
      content: `Hello! I am your **Manufacturing ERP Guide**. I can help you with:\n\n• **Inventory & Warehouses**: Balances, ledger, cycle count adjustments, reorder alerts.\n• **Production & BOM**: Engineering formulas, work orders, shop-floor material issuance.\n• **Procurement**: Purchase orders, requisitions, goods receipts (GRN).\n• **Sales & Dispatches**: Orders, packing & shipping, customer invoicing.\n• **Finance & Payments**: Commercial invoice PDFs, cash & wire payment settlements.\n\nType your question or choose one of the quick suggestions below!`,
      suggestions: [
        'How do I receive purchased goods?',
        'How to create a Work Order?',
        'Where can I see low stock alerts?',
        'How do I generate an invoice PDF?',
      ],
    };
  }

  // 5. Default Fallback with Smart Suggestions
  return {
    title: 'Manufacturing ERP Guide',
    content: `I couldn't find a direct match for: *"${userInput}"*.\n\nHere are some of the most common actions you can take in the system:\n• **Procurement**: Raise Purchase Orders and receive goods via Goods Receipts.\n• **Manufacturing**: Build Bills of Materials (BOM) and run Work Orders.\n• **Inventory**: Check real-time stock balances and adjust counts.\n• **Sales**: Dispatch orders and export Commercial Invoices as PDF.\n\nTry clicking one of the suggested topics below or tell me which module you'd like to work with!`,
    suggestions: [
      'How to receive goods?',
      'How to create a work order?',
      'How to create a BOM?',
      'How to generate an invoice?',
    ],
  };
}
