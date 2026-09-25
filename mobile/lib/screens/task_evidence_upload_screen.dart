import 'package:flutter/material.dart';
import '../api/task_api.dart';
import '../models/farm_task.dart';
import '../widgets/app_theme.dart';

class TaskEvidenceUploadScreen extends StatefulWidget {
  final FarmTask task;

  const TaskEvidenceUploadScreen({super.key, required this.task});

  @override
  State<TaskEvidenceUploadScreen> createState() => _TaskEvidenceUploadScreenState();
}

class _TaskEvidenceUploadScreenState extends State<TaskEvidenceUploadScreen> {
  final _photoUrlController = TextEditingController();
  final _remarksController = TextEditingController();
  bool _submitting = false;

  final List<String> _sampleEvidencePhotos = [
    'https://images.unsplash.com/photo-1592417817098-8f3d6eb228cc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
  ];

  @override
  void initState() {
    super.initState();
    _photoUrlController.text = _sampleEvidencePhotos[0];
    _remarksController.text = 'Field work completed successfully. Photo evidence attached for verification.';
  }

  Future<void> _submitEvidence() async {
    final photoUrl = _photoUrlController.text.trim();
    if (photoUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide an evidence photo URL')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await TaskApi.submitEvidence(
        widget.task.id,
        evidencePhotoUrl: photoUrl,
        remarks: _remarksController.text.trim(),
      );

      // Automatically update status to Completed upon evidence submission
      await TaskApi.updateTaskStatus(
        widget.task.id,
        'Completed',
        remarks: 'Evidence submitted by mobile field worker',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.primaryGreen,
            content: Text('Evidence submitted and task marked as Completed!'),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red.shade700, content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Task Evidence')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          widget.task.taskType,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade100,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            widget.task.priority,
                            style: TextStyle(
                              color: Colors.orange.shade900,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.task.description,
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Target Date: ${widget.task.targetDate.split('T')[0]}',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Evidence Photo',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _photoUrlController,
              decoration: InputDecoration(
                labelText: 'Photo URL / Image Source',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () => _photoUrlController.clear(),
                ),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            const Text(
              'Quick Samples for Mobile Testing:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: [
                ActionChip(
                  label: const Text('Field Crop Sample'),
                  onPressed: () => setState(() => _photoUrlController.text = _sampleEvidencePhotos[0]),
                ),
                ActionChip(
                  label: const Text('Irrigation Sample'),
                  onPressed: () => setState(() => _photoUrlController.text = _sampleEvidencePhotos[1]),
                ),
                ActionChip(
                  label: const Text('Planting Sample'),
                  onPressed: () => setState(() => _photoUrlController.text = _sampleEvidencePhotos[2]),
                ),
              ],
            ),
            if (_photoUrlController.text.isNotEmpty) ...[
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  _photoUrlController.text,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 120,
                    color: Colors.grey.shade200,
                    alignment: Alignment.center,
                    child: const Text('Preview not available (invalid image URL)'),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 20),
            Text(
              'Completion Remarks & Notes',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _remarksController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Describe how the task was executed or any observations...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submitEvidence,
                icon: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.cloud_upload),
                label: Text(_submitting ? 'Submitting Evidence...' : 'Submit Evidence & Complete Task'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
