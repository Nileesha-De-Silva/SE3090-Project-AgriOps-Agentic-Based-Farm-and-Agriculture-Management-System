import 'package:flutter/material.dart';

class GrowthStageBadge extends StatelessWidget {
  final String stage;

  const GrowthStageBadge({super.key, required this.stage});

  Color _colorForStage(String stage) {
    switch (stage) {
      case 'Germination':
        return Colors.blue.shade100;
      case 'Vegetative':
        return Colors.lightGreen.shade100;
      case 'Flowering':
        return Colors.pink.shade100;
      case 'Fruiting':
        return Colors.orange.shade100;
      case 'Harvesting':
        return Colors.amber.shade200;
      case 'PastHarvest':
        return Colors.grey.shade300;
      default:
        return Colors.grey.shade200;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _colorForStage(stage),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        stage,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }
}