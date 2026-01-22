<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order Approved</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .approved-badge {
            display: inline-block;
            background-color: #ffffff;
            color: #2e7d32;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #e8f5e9;
            border-left: 4px solid #2e7d32;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #2e7d32;
            font-size: 16px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 8px;
            font-size: 14px;
        }
        .info-label {
            font-weight: 600;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .priority-normal {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        .priority-urgent {
            background-color: #fff3e0;
            color: #f57c00;
        }
        .priority-emergency {
            background-color: #ffebee;
            color: #c62828;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
        }
        .items-table thead {
            background-color: #2e7d32;
            color: #ffffff;
        }
        .items-table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        .items-table tbody tr:last-child td {
            border-bottom: none;
        }
        .items-table tbody tr:hover {
            background-color: #f8f9fa;
        }
        .total-row {
            background-color: #e8f5e9;
            font-weight: bold;
        }
        .total-row td {
            padding: 15px 12px;
            font-size: 16px;
            color: #2e7d32;
        }
        .action-section {
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .action-section h4 {
            margin: 0 0 10px 0;
            color: #f57c00;
            font-size: 16px;
        }
        .action-section p {
            margin: 0;
            font-size: 14px;
            color: #555;
        }
        .remarks {
            background-color: #f3e5f5;
            border-left: 4px solid #9c27b0;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .remarks h4 {
            margin: 0 0 8px 0;
            color: #7b1fa2;
            font-size: 14px;
        }
        .remarks p {
            margin: 0;
            font-size: 14px;
            color: #555;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #e0e0e0;
        }
        .footer h4 {
            margin: 0 0 10px 0;
            color: #2e7d32;
            font-size: 16px;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #555;
        }
        .delivery-info {
            background-color: #e3f2fd;
            border-left: 4px solid #1976d2;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .delivery-info h4 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 16px;
        }
        .copyright {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #888;
            background-color: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $hospitalName }}</h1>
            <p>Purchase Order Notification</p>
            <span class="approved-badge">✓ ORDER APPROVED</span>
        </div>
        
        <div class="content">
            <p class="greeting">Dear <strong>{{ $supplierName }}</strong>,</p>
            
            <p>We would appreciate your prompt action in delivering the following goods at your earliest convenience.</p>
            
            <div class="info-box">
                <h3>Order Details</h3>
                <div class="info-grid">
                    <span class="info-label">PO Number:</span>
                    <span class="info-value"><strong>{{ $prNumber }}</strong></span>
                    
                    <span class="info-label">Approval Date:</span>
                    <span class="info-value">{{ $approvedDate }}</span>
                    
                    <span class="info-label">Approved By:</span>
                    <span class="info-value">{{ $approverName }}</span>
                    
                    <span class="info-label">Priority:</span>
                    <span class="info-value">
                        <span class="priority-badge priority-{{ strtolower($priority) }}">{{ $priority }}</span>
                    </span>
                    
                    <span class="info-label">Branch:</span>
                    <span class="info-value">{{ $branchName }}</span>
                </div>
            </div>
            
            <h3>Ordered Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Item Code</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $item->product->item_name ?? 'Unknown Item' }}</td>
                        <td>{{ $item->product->item_code ?? 'N/A' }}</td>
                        <td>{{ number_format($item->requested_quantity) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            
            <div class="action-section">
                <h4>⚡ Action Required</h4>
                <p>Please proceed with the order fulfillment at your earliest convenience. Kindly confirm the delivery timeline by responding to this email or contacting us directly.</p>
            </div>
            
            @if($approvalRemarks)
            <div class="remarks">
                <h4>📝 Approval Remarks</h4>
                <p>{{ $approvalRemarks }}</p>
            </div>
            @endif
            
            <div class="delivery-info">
                <h4>📍 Delivery Address</h4>
                <p><strong>{{ $branchName }}</strong></p>
                <p>{{ $branchAddress }}</p>
            </div>
        </div>
        
        <div class="footer">
            <h4>Contact Information</h4>
            <p><strong>Email:</strong> {{ $contactEmail }}</p>
            <p><strong>Phone:</strong> {{ $contactPhone }}</p>
            <p style="margin-top: 15px; font-size: 13px; color: #888;">
                If you have any questions regarding this order, please don't hesitate to contact us.
            </p>
        </div>
        
        <div class="copyright">
            &copy; {{ date('Y') }} {{ $hospitalName }}. All rights reserved.
        </div>
    </div>
</body>
</html>
