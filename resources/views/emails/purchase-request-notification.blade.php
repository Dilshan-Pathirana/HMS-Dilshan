<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Request Notification</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .content {
            padding: 30px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #667eea;
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
            background-color: #667eea;
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
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #e0e0e0;
        }
        .footer h4 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 16px;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #555;
        }
        .remarks {
            background-color: #fff9c4;
            border-left: 4px solid #fbc02d;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .remarks h4 {
            margin: 0 0 8px 0;
            color: #f57f17;
            font-size: 14px;
        }
        .remarks p {
            margin: 0;
            color: #555;
            font-size: 14px;
        }
        .action-button {
            display: inline-block;
            background-color: #667eea;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
        }
        .action-button:hover {
            background-color: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📦 New Purchase Request</h1>
            <p>{{ $hospitalName }}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Greeting -->
            <p style="font-size: 16px; margin-bottom: 20px;">
                Dear <strong>{{ $supplierName }}</strong>,
            </p>
            <p style="margin-bottom: 20px;">
                We have created a new purchase request for your review. Please find the details below:
            </p>

            <!-- Purchase Request Info -->
            <div class="info-box">
                <h3>Purchase Request Details</h3>
                <div class="info-grid">
                    <span class="info-label">PR Number:</span>
                    <span class="info-value"><strong>{{ $prNumber }}</strong></span>
                    
                    <span class="info-label">Priority:</span>
                    <span class="info-value">
                        <span class="priority-badge priority-{{ strtolower($priority) }}">
                            {{ $priority }}
                        </span>
                    </span>
                    
                    <span class="info-label">Request Date:</span>
                    <span class="info-value">{{ $createdDate }}</span>
                    
                    <span class="info-label">Branch:</span>
                    <span class="info-value">{{ $branchName }}</span>
                </div>
            </div>

            <!-- Items Table -->
            <h3 style="color: #667eea; margin-top: 30px;">Requested Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Item Name</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Est. Unit Price (LKR)</th>
                        <th style="text-align: right;">Line Total (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->product->item_name }}</strong>
                            @if($item->product->item_code)
                                <br><small style="color: #888;">Code: {{ $item->product->item_code }}</small>
                            @endif
                            @if($item->suggestion_reason)
                                <br><span style="display: inline-block; padding: 2px 8px; background-color: #ffebee; color: #c62828; border-radius: 3px; font-size: 11px; margin-top: 4px;">
                                    {{ $item->suggestion_reason }}
                                </span>
                            @endif
                        </td>
                        <td style="text-align: center;">{{ $item->requested_quantity }} {{ $item->product->unit ?? 'units' }}</td>
                        <td style="text-align: right;">{{ number_format($item->estimated_unit_price, 2) }}</td>
                        <td style="text-align: right;"><strong>{{ number_format($item->requested_quantity * $item->estimated_unit_price, 2) }}</strong></td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="4" style="text-align: right;">TOTAL ESTIMATED COST:</td>
                        <td style="text-align: right;">LKR {{ number_format($totalEstimatedCost, 2) }}</td>
                    </tr>
                </tfoot>
            </table>

            <!-- Remarks -->
            @if($remarks)
            <div class="remarks">
                <h4>📝 Additional Remarks</h4>
                <p>{{ $remarks }}</p>
            </div>
            @endif

            <!-- Action -->
            <div style="text-align: center; margin-top: 30px;">
                <p style="margin-bottom: 15px;">Please confirm availability and delivery timeline at your earliest convenience.</p>
                <!-- Optional: Add a link to supplier portal if you have one -->
                <!-- <a href="{{ url('/supplier-portal') }}" class="action-button">View in Portal</a> -->
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <h4>📞 Contact Information</h4>
            <p><strong>Branch:</strong> {{ $branchName }}</p>
            <p><strong>Email:</strong> {{ $contactEmail }}</p>
            <p><strong>Phone:</strong> {{ $contactPhone }}</p>
            
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
                This is an automated notification. Please do not reply to this email directly. 
                For any queries, please contact us at the above details.
            </p>
        </div>
    </div>
</body>
</html>
