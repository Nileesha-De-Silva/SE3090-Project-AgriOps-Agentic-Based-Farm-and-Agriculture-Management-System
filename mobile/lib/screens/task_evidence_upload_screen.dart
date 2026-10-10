import 'package:flutter/material.dart';

import '../api/task_api.dart';
import '../models/farm_task.dart';
import '../widgets/app_theme.dart';

class TaskEvidenceUploadScreen extends StatefulWidget {
  final FarmTask task;

  const TaskEvidenceUploadScreen({super.key, required this.task});

  @override
  State<TaskEvidenceUploadScreen> createState() =>
      _TaskEvidenceUploadScreenState();
}

class _TaskEvidenceUploadScreenState extends State<TaskEvidenceUploadScreen> {
  final _photoUrlController = TextEditingController();
  final _remarksController = TextEditingController();
  bool _submitting = false;
  String? _photoError;

  // Sample crop photographic evidence presets for quick Camera & Gallery selection
  static const String defaultCameraPhoto =
      'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=800&q=80';
  static const String defaultGalleryPhoto =
      'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80';

  @override
  void dispose() {
    _photoUrlController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  void _onPhotoCaptured(String url) {
    setState(() {
      _photoUrlController.text = url;
      _photoError = null;
    });
  }

  void _showCameraCaptureDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.camera_alt, color: AppTheme.primaryGreen),
                  const SizedBox(width: 8),
                  Text(
                    'Field Camera Capture',
                    style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Simulate snapping real-time crop foliage and field treatment evidence:',
                style: TextStyle(color: Colors.black87, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.eco, color: Colors.green),
                title: const Text('Foliar Spray Coverage (Rows 1–12)'),
                subtitle: const Text('Clean crop canopy with no leaf miners'),
                onTap: () {
                  Navigator.pop(ctx);
                  _onPhotoCaptured(defaultCameraPhoto);
                },
              ),
              ListTile(
                leading: const Icon(Icons.agriculture, color: Colors.brown),
                title: const Text('Full Crop Plot Rows'),
                subtitle: const Text('Wide angle field row inspection'),
                onTap: () {
                  Navigator.pop(ctx);
                  _onPhotoCaptured(defaultGalleryPhoto);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showGalleryPickerDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.photo_library, color: Colors.blue),
                  const SizedBox(width: 8),
                  Text(
                    'Select from Photo Gallery',
                    style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Choose a saved high-resolution field evidence photograph:',
                style: TextStyle(color: Colors.black87, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.image, color: Colors.blue),
                title: const Text('Inspected Tomato Foliage'),
                subtitle: const Text('Post-treatment verification snapshot'),
                onTap: () {
                  Navigator.pop(ctx);
                  _onPhotoCaptured(defaultGalleryPhoto);
                },
              ),
              ListTile(
                leading: const Icon(Icons.local_florist, color: Colors.teal),
                title: const Text('Field Pest Inspection Photo'),
                subtitle: const Text('Close-up crop health check'),
                onTap: () {
                  Navigator.pop(ctx);
                  _onPhotoCaptured(defaultCameraPhoto);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitEvidence() async {
    final photoUrl = _photoUrlController.text.trim();
    if (photoUrl.isEmpty) {
      setState(() => _photoError = 'Photo evidence is required');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.red,
          content: Text('Photo evidence is required'),
        ),
      );
      return;
    }

    setState(() {
      _submitting = true;
      _photoError = null;
    });

    try {
      final remarks = _remarksController.text.trim().isEmpty
          ? 'Completed foliar spray and inspected rows 1 to 12. No leaf miners detected.'
          : _remarksController.text.trim();

      // Submit evidence to backend. The backend updates task status to 'PendingVerification'
      await TaskApi.submitEvidence(
        widget.task.id,
        evidencePhotoUrl: photoUrl,
        remarks: remarks,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.primaryGreen,
            content: Text(
              'Evidence submitted! Task status transitioned to Pending Verification!',
            ),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade700,
            content: Text('Error: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPhoto = _photoUrlController.text.trim().isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text('Submit Task Evidence')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Task context summary card
            Card(
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
                            widget.task.taskType,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
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
                      'Target Date: ${widget.task.targetDate.contains("T") ? widget.task.targetDate.split('T')[0] : widget.task.targetDate}',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Photographic evidence header & action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Photographic Evidence *',
                  style: Theme.of(context).textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (hasPhoto)
                  TextButton.icon(
                    onPressed: () => setState(() => _photoUrlController.clear()),
                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                    label: const Text('Remove', style: TextStyle(color: Colors.red, fontSize: 13)),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            // Camera / Gallery quick capture toolbar
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Camera'),
                    onPressed: _showCameraCaptureDialog,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryGreen,
                      side: const BorderSide(color: AppTheme.primaryGreen),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Gallery'),
                    onPressed: _showGalleryPickerDialog,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Live Image Preview / Empty Placeholder
            if (hasPhoto) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  alignment: Alignment.bottomLeft,
                  children: [
                    Image.network(
                      _photoUrlController.text.trim(),
                      height: 190,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        height: 140,
                        color: Colors.grey.shade200,
                        alignment: Alignment.center,
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.broken_image, color: Colors.grey, size: 36),
                            SizedBox(height: 6),
                            Text('Preview not available (validating image URL)'),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle, color: Colors.greenAccent, size: 16),
                          SizedBox(width: 6),
                          Text(
                            'Photo Evidence Attached',
                            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                height: 130,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: _photoError != null ? Colors.red.shade50 : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _photoError != null ? Colors.red.shade400 : Colors.grey.shade300,
                    width: 1.5,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.add_a_photo_outlined,
                      size: 38,
                      color: _photoError != null ? Colors.red.shade400 : Colors.grey.shade600,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No photo attached yet',
                      style: TextStyle(
                        color: _photoError != null ? Colors.red.shade700 : Colors.grey.shade700,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap Camera or Gallery above to capture crops/field',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (_photoError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 6, left: 4),
                  child: Text(
                    _photoError!,
                    style: TextStyle(color: Colors.red.shade700, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
            const SizedBox(height: 14),

            // Direct URL textfield fallback
            TextField(
              controller: _photoUrlController,
              decoration: InputDecoration(
                labelText: 'Photo URL / Image Source',
                hintText: 'https://... or choose from Camera / Gallery above',
                border: const OutlineInputBorder(),
                suffixIcon: hasPhoto
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _photoUrlController.clear()),
                      )
                    : null,
              ),
              onChanged: (_) {
                if (_photoError != null) setState(() => _photoError = null);
                setState(() {});
              },
            ),
            const SizedBox(height: 20),

            // Worker remarks header & quick insert chip
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Worker Remarks & Observations',
                  style: Theme.of(context).textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ActionChip(
              avatar: const Icon(Icons.bolt, size: 16, color: AppTheme.primaryGreen),
              label: const Text('Insert Standard Foliar Spray Remarks'),
              onPressed: () {
                setState(() {
                  _remarksController.text =
                      'Completed foliar spray and inspected rows 1 to 12. No leaf miners detected.';
                });
              },
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _remarksController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText:
                    'Completed foliar spray and inspected rows 1 to 12. No leaf miners detected.',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submitEvidence,
                icon: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Icon(Icons.cloud_upload),
                label: Text(
                  _submitting
                      ? 'Submitting Evidence...'
                      : 'Submit Evidence',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
