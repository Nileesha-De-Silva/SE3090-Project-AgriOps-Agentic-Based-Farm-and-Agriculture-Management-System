import 'package:flutter/material.dart';
import '../api/analytics_api.dart';
import '../widgets/app_theme.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _loading = false;
  String? _error;
  List<SeasonYield> _yields = [];

  // Sentinel state
  bool _sentinelRunning = false;
  String? _sentinelError;
  SentinelReport? _sentinelReport;
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await AnalyticsApi.getHarvestYields();
      setState(() {
        _yields = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _runSentinel() async {
    setState(() {
      _sentinelRunning = true;
      _sentinelError = null;
    });
    try {
      final report = await AnalyticsApi.runSentinelAudit();
      setState(() {
        _sentinelReport = report;
        _sentinelRunning = false;
      });
    } catch (e) {
      setState(() {
        _sentinelError = e.toString();
        _sentinelRunning = false;
      });
    }
  }

  Future<void> _decideIntervention(bool approve) async {
    if (_sentinelReport == null) return;
    setState(() => _sentinelRunning = true);
    try {
      final updated = approve
          ? await AnalyticsApi.approveIntervention(_sentinelReport!.runId, _notesController.text)
          : await AnalyticsApi.rejectIntervention(_sentinelReport!.runId, _notesController.text);
      setState(() {
        _sentinelReport = updated;
        _notesController.clear();
        _sentinelRunning = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: approve ? Colors.green : Colors.red,
            content: Text(approve ? 'Intervention Approved & Task Scheduled!' : 'Intervention Rejected.'),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _sentinelError = e.toString();
        _sentinelRunning = false;
      });
    }
  }

  Color _getRiskColor(String risk) {
    switch (risk.toUpperCase()) {
      case 'CRITICAL':
        return Colors.red.shade700;
      case 'HIGH':
        return Colors.orange.shade800;
      case 'MEDIUM':
        return Colors.amber.shade800;
      default:
        return Colors.green.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    final grandTotal = _yields.fold<double>(0.0, (sum, y) => sum + y.totalYield);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Production & Sentinel'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Header Card
                  Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.analytics, color: AppTheme.primaryGreen),
                              const SizedBox(width: 8),
                              Text(
                                'Component 4 • Analytics & Sentinel',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Historical seasonal harvest trends and autonomous operations sentinel monitoring.',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Column(
                                children: [
                                  const Text('Total Yield', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${grandTotal.toStringAsFixed(1)} kg',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  ),
                                ],
                              ),
                              Column(
                                children: [
                                  const Text('Harvest Records', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${_yields.length}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // AI Sentinel Action Button
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: _sentinelRunning
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.shield_outlined),
                    label: Text(_sentinelRunning ? 'Evaluating Operations...' : 'Run AI Sentinel Audit (Agent 4)'),
                    onPressed: _sentinelRunning ? null : _runSentinel,
                  ),

                  if (_sentinelError != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text('Sentinel error: $_sentinelError', style: TextStyle(color: Colors.red.shade800)),
                    ),
                  ],

                  // Sentinel Report Card
                  if (_sentinelReport != null) ...[
                    const SizedBox(height: 16),
                    Card(
                      elevation: 3,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: _getRiskColor(_sentinelReport!.overallRiskLevel), width: 1.5),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'AI Sentinel Report',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getRiskColor(_sentinelReport!.overallRiskLevel).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    'RISK: ${_sentinelReport!.overallRiskLevel}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: _getRiskColor(_sentinelReport!.overallRiskLevel),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Yield Score: ${_sentinelReport!.yieldPerformanceScore.toStringAsFixed(1)} / 100',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            if (_sentinelReport!.strategicCommentary.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _sentinelReport!.strategicCommentary,
                                  style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 13),
                                ),
                              ),

                            // Proposed Remediation & Human Approval Gate
                            if (_sentinelReport!.remediation != null) ...[
                              const SizedBox(height: 12),
                              const Divider(),
                              Text(
                                'Proposed Intervention Plan',
                                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey.shade800),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _sentinelReport!.remediation!['action_summary'] ?? 'Action plan',
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Justification: ${_sentinelReport!.remediation!['justification'] ?? ''}',
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                              ),
                              const SizedBox(height: 12),

                              if (_sentinelReport!.status == 'awaiting_approval') ...[
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.amber.shade300),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Row(
                                        children: [
                                          Icon(Icons.gavel, size: 18, color: Colors.amber),
                                          SizedBox(width: 6),
                                          Text('Manager Approval Gate', style: TextStyle(fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      TextField(
                                        controller: _notesController,
                                        decoration: const InputDecoration(
                                          hintText: 'Enter manager approval notes...',
                                          isDense: true,
                                          border: OutlineInputBorder(),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.green,
                                                foregroundColor: Colors.white,
                                              ),
                                              onPressed: () => _decideIntervention(true),
                                              child: const Text('Approve'),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.red,
                                                foregroundColor: Colors.white,
                                              ),
                                              onPressed: () => _decideIntervention(false),
                                              child: const Text('Reject'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],

                              if (_sentinelReport!.finalOutcome != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  _sentinelReport!.finalOutcome!,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: _sentinelReport!.approvalStatus == 'approved' ? Colors.green : Colors.red,
                                  ),
                                ),
                              ],
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),
                  Text(
                    'Harvest Trends by Season',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),

                  if (_yields.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(child: Text('No historical harvest records found.')),
                    )
                  else
                    ..._yields.map(
                      (y) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: AppTheme.primaryGreen,
                            child: Icon(Icons.grass, color: Colors.white, size: 20),
                          ),
                          title: Text('${y.cropName} (${y.seasonName})'),
                          subtitle: Text('Field: ${y.fieldName} • Started: ${y.startDate.split('T').first}'),
                          trailing: Text(
                            '${y.totalYield.toStringAsFixed(1)} kg',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
