import 'dart:convert';

class CropAnalysisAssessment {
  final String id;
  final String workflowId;
  final String fieldId;
  final String cropVariety;
  final String growthStage;
  final String observationText;
  final String? imageUrl;
  final String? primaryIndicator;
  final List<String> potentialStressFactors;
  final String riskLevel;
  final List<String> recommendedActions;
  final String? suggestedTaskType;
  final String? priority;
  final String status;
  final String createdAt;

  CropAnalysisAssessment({
    required this.id,
    required this.workflowId,
    required this.fieldId,
    required this.cropVariety,
    required this.growthStage,
    required this.observationText,
    this.imageUrl,
    this.primaryIndicator,
    required this.potentialStressFactors,
    required this.riskLevel,
    required this.recommendedActions,
    this.suggestedTaskType,
    this.priority,
    required this.status,
    required this.createdAt,
  });

  factory CropAnalysisAssessment.fromJson(Map<String, dynamic> json) {
    List<String> parseList(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) return raw.map((e) => e.toString()).toList();
      if (raw is String && raw.isNotEmpty) {
        try {
          final decoded = jsonDecode(raw);
          if (decoded is List) return decoded.map((e) => e.toString()).toList();
        } catch (_) {}
      }
      return [];
    }

    return CropAnalysisAssessment(
      id: json['id']?.toString() ?? '',
      workflowId: json['workflowId']?.toString() ?? '',
      fieldId: json['fieldId']?.toString() ?? '',
      cropVariety: json['cropVariety']?.toString() ?? '',
      growthStage: json['growthStage']?.toString() ?? '',
      observationText: json['observationText']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
      primaryIndicator: json['primaryIndicator']?.toString(),
      potentialStressFactors: parseList(json['potentialStressFactorsJson'] ?? json['potentialStressFactors']),
      riskLevel: json['riskLevel']?.toString() ?? 'Low',
      recommendedActions: parseList(json['recommendedActionsJson'] ?? json['recommendedActions']),
      suggestedTaskType: json['suggestedTaskType']?.toString(),
      priority: json['priority']?.toString(),
      status: json['status']?.toString() ?? 'PendingApproval',
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}
