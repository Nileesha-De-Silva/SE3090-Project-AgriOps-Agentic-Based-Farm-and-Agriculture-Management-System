import 'package:flutter/material.dart';
import '../api/crop_analysis_api.dart';
import '../api/component1_api.dart';
import '../models/crop_analysis_assessment.dart';
import '../models/field.dart';
import '../widgets/app_theme.dart';

class CropAnalysisScreen extends StatefulWidget {
  const CropAnalysisScreen({super.key});

  @override
  State<CropAnalysisScreen> createState() => _CropAnalysisScreenState();
}

class _CropAnalysisScreenState extends State<CropAnalysisScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Form state
  List<Field> _fields = [];
  String? _selectedFieldId;
  final _cropVarietyController = TextEditingController(text: 'Roma Tomato');
  final _growthStageController = TextEditingController(text: 'Flowering');
  final _observationController = TextEditingController(text: 'Yellowing of lower leaves with concentric dark rings, spreading towards upper foliage.');
  final _imageUrlController = TextEditingController();

  bool _loadingFields = true;
  bool _analyzing = false;
  CropAnalysisAssessment? _lastAssessment;
  String? _analysisError;

  // Pending Approvals state
  List<CropAnalysisAssessment> _pendingApprovals = [];
  bool _loadingPending = false;
  String? _pendingError;

  final List<String> _sampleDiseasePhotos = [
    'https://images.unsplash.com/photo-1592417817098-8f3d6eb228cc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=600&q=80',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _imageUrlController.text = _sampleDiseasePhotos[0];
    _loadFields();
    _loadPendingApprovals();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _cropVarietyController.dispose();
    _growthStageController.dispose();
    _observationController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadFields() async {
    try {
      final fields = await Component1Api.getFields();
      setState(() {
        _fields = fields;
        if (fields.isNotEmpty) {
          _selectedFieldId = fields.first.id;
        }
        _loadingFields = false;
      });
    } catch (_) {
      setState(() => _loadingFields = false);
    }
  }

  Future<void> _loadPendingApprovals() async {
    setState(() {
      _loadingPending = true;
      _pendingError = null;
    });
    try {
      final list = await CropAnalysisApi.getPendingApprovals();
      setState(() {
        _pendingApprovals = list;
        _loadingPending = false;
      });
    } catch (e) {
      setState(() {
        _pendingError = e.toString();
        _loadingPending = false;
      });
    }
  }

  Future<void> _submitAnalysis() async {
    if (_selectedFieldId == null && _fields.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please create a farm and field first!')),
      );
      return;
    }

    if (_observationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe the observed symptoms')),
      );
      return;
    }

    setState(() {
      _analyzing = true;
      _analysisError = null;
      _lastAssessment = null;
    });

    try {
      final result = await CropAnalysisApi.submitCropAnalysis(
        fieldId: _selectedFieldId ?? '',
        cropVariety: _cropVarietyController.text.trim(),
        growthStage: _growthStageController.text.trim(),
        observationText: _observationController.text.trim(),
        imageUrl: _imageUrlController.text.trim().isEmpty ? null : _imageUrlController.text.trim(),
      );

      setState(() {
        _lastAssessment = result;
        _analyzing = false;
      });
      _loadPendingApprovals();
    } catch (e) {
      setState(() {
        _analysisError = e.toString();
        _analyzing = false;
      });
    }
  }

  Future<void> _approveAssessment(CropAnalysisAssessment assessment) async {
    try {
      await CropAnalysisApi.approveAssessment(assessment.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.primaryGreen,
          content: Text('Assessment approved! Farm task has been created automatically.'),
        ),
      );
      _loadPendingApprovals();
      if (_lastAssessment?.id == assessment.id) {
        setState(() => _lastAssessment = null);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _rejectAssessment(CropAnalysisAssessment assessment) async {
    try {
      await CropAnalysisApi.rejectAssessment(assessment.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assessment rejected.')),
      );
      _loadPendingApprovals();
      if (_lastAssessment?.id == assessment.id) {
        setState(() => _lastAssessment = null);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Color _getRiskColor(String risk) {
    switch (risk.toLowerCase()) {
      case 'high':
      case 'critical':
        return Colors.red.shade700;
      case 'medium':
        return Colors.orange.shade800;
      case 'low':
      default:
        return AppTheme.primaryGreen;
    }
  }

  Widget _buildAssessmentCard(CropAnalysisAssessment assessment) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    assessment.primaryIndicator ?? 'Crop Stress Detected',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getRiskColor(assessment.riskLevel).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: _getRiskColor(assessment.riskLevel)),
                  ),
                  child: Text(
                    '${assessment.riskLevel} Risk',
                    style: TextStyle(
                      color: _getRiskColor(assessment.riskLevel),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Variety: ${assessment.cropVariety} (${assessment.growthStage})',
              style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
            ),
            const SizedBox(height: 12),
            if (assessment.potentialStressFactors.isNotEmpty) ...[
              const Text('Potential Stress Factors:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: assessment.potentialStressFactors.map((f) => Chip(
                  backgroundColor: Colors.amber.shade50,
                  label: Text(f, style: TextStyle(fontSize: 12, color: Colors.amber.shade900)),
                )).toList(),
              ),
              const SizedBox(height: 10),
            ],
            if (assessment.recommendedActions.isNotEmpty) ...[
              const Text('Recommended Actions:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              ...assessment.recommendedActions.map((action) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.primaryGreen),
                    const SizedBox(width: 6),
                    Expanded(child: Text(action, style: const TextStyle(fontSize: 13))),
                  ],
                ),
              )),
              const SizedBox(height: 12),
            ],
            if (assessment.suggestedTaskType != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.assignment, color: Colors.blue, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Suggested Task: ${assessment.suggestedTaskType} (${assessment.priority ?? 'Medium'} Priority)',
                        style: TextStyle(fontSize: 13, color: Colors.blue.shade900, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _rejectAssessment(assessment),
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _approveAssessment(assessment),
                    icon: const Icon(Icons.add_task, size: 18),
                    label: const Text('Approve & Task'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crop AI Doctor'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.psychology), text: 'Diagnosis'),
            Tab(icon: Icon(Icons.pending_actions), text: 'Approvals'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Diagnose
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_loadingFields)
                  const LinearProgressIndicator()
                else if (_fields.isNotEmpty) ...[
                  const Text('Field Location', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    value: _selectedFieldId,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: _fields.map((f) => DropdownMenuItem(
                      value: f.id,
                      child: Text('${f.fieldName} (${f.areaSize} acres)'),
                    )).toList(),
                    onChanged: (val) => setState(() => _selectedFieldId = val),
                  ),
                  const SizedBox(height: 12),
                ],
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _cropVarietyController,
                        decoration: const InputDecoration(
                          labelText: 'Crop Variety',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _growthStageController,
                        decoration: const InputDecoration(
                          labelText: 'Growth Stage',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _observationController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Symptom Observations',
                    hintText: 'Describe leaf discoloration, pests, wilt, spots...',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _imageUrlController,
                  decoration: InputDecoration(
                    labelText: 'Photo URL (optional)',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => _imageUrlController.clear(),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ActionChip(
                      label: const Text('Sample Photo 1'),
                      onPressed: () => setState(() => _imageUrlController.text = _sampleDiseasePhotos[0]),
                    ),
                    ActionChip(
                      label: const Text('Sample Photo 2'),
                      onPressed: () => setState(() => _imageUrlController.text = _sampleDiseasePhotos[1]),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: _analyzing ? null : _submitAnalysis,
                    icon: _analyzing
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.auto_awesome),
                    label: Text(_analyzing ? 'Analyzing with AI Subsystem...' : 'Run AI Diagnosis'),
                  ),
                ),
                if (_analysisError != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(
                      'Analysis Error: $_analysisError',
                      style: TextStyle(color: Colors.red.shade800),
                    ),
                  ),
                ],
                if (_lastAssessment != null) ...[
                  const SizedBox(height: 20),
                  Text(
                    'AI Diagnostic Result',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  _buildAssessmentCard(_lastAssessment!),
                ],
              ],
            ),
          ),

          // Tab 2: Pending Approvals
          RefreshIndicator(
            onRefresh: _loadPendingApprovals,
            child: _loadingPending
                ? const Center(child: CircularProgressIndicator())
                : _pendingError != null
                    ? Center(child: Text('Error: $_pendingError'))
                    : _pendingApprovals.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_outline, size: 56, color: Colors.grey.shade400),
                                const SizedBox(height: 12),
                                Text(
                                  'No pending AI assessments awaiting approval.',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _pendingApprovals.length,
                            itemBuilder: (context, index) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _buildAssessmentCard(_pendingApprovals[index]),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
