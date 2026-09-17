import 'package:flutter/material.dart';
import '../api/component1_api.dart';
import '../models/crop_season.dart';
import '../widgets/growth_stage_badge.dart';

class CropSeasonDetailScreen extends StatefulWidget {
  final CropSeason cropSeason;

  const CropSeasonDetailScreen({super.key, required this.cropSeason});

  @override
  State<CropSeasonDetailScreen> createState() => _CropSeasonDetailScreenState();
}

class _CropSeasonDetailScreenState extends State<CropSeasonDetailScreen> {
  bool _submitting = false;

  void _showLogPlantingDialog() {
    final quantityController = TextEditingController();
    final methodController = TextEditingController();
    final notesController = TextEditingController();
    DateTime plantingDate = DateTime.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Log Planting'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('Planting Date: ${plantingDate.toLocal().toString().split(' ')[0]}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: plantingDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setDialogState(() => plantingDate = picked);
                    }
                  },
                ),
                TextField(
                  controller: quantityController,
                  decoration: const InputDecoration(labelText: 'Initial Quantity'),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: methodController,
                  decoration: const InputDecoration(labelText: 'Planting Method (optional)'),
                ),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(labelText: 'Notes (optional)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: _submitting
                  ? null
                  : () async {
                      setDialogState(() => _submitting = true);
                      try {
                        await Component1Api.createPlanting(widget.cropSeason.id, {
                          'plantingDate': plantingDate.toIso8601String(),
                          'initialQuantity': double.tryParse(quantityController.text) ?? 0,
                          'plantingMethod': methodController.text.isEmpty
                              ? null
                              : methodController.text,
                          'notes': notesController.text.isEmpty ? null : notesController.text,
                        });
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Planting logged successfully')),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString())),
                          );
                        }
                      } finally {
                        setDialogState(() => _submitting = false);
                      }
                    },
              child: Text(_submitting ? 'Saving...' : 'Save'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final season = widget.cropSeason;

    return Scaffold(
      appBar: AppBar(title: Text(season.seasonName)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showLogPlantingDialog,
        icon: const Icon(Icons.add),
        label: const Text('Log Planting'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              children: [
                Chip(label: Text(season.status)),
                if (season.currentGrowthStage != null)
                  GrowthStageBadge(stage: season.currentGrowthStage!),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${season.startDate.toLocal().toString().split(' ')[0]} → '
              '${season.targetEndDate.toLocal().toString().split(' ')[0]}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}