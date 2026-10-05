class CropSeason {
  final String id;
  final String fieldId;
  final String cropId;
  final String seasonName;
  final DateTime startDate;
  final DateTime targetEndDate;
  final String status;
  final String? currentGrowthStage;

  CropSeason({
    required this.id,
    required this.fieldId,
    required this.cropId,
    required this.seasonName,
    required this.startDate,
    required this.targetEndDate,
    required this.status,
    this.currentGrowthStage,
  });

  factory CropSeason.fromJson(Map<String, dynamic> json) {
    return CropSeason(
      id: json['id'],
      fieldId: json['fieldId'],
      cropId: json['cropId'],
      seasonName: json['seasonName'],
      startDate: DateTime.parse(json['startDate']),
      targetEndDate: DateTime.parse(json['targetEndDate']),
      status: json['status'],
      currentGrowthStage: json['currentGrowthStage'],
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'fieldId': fieldId,
      'cropId': cropId,
      'seasonName': seasonName,
      'startDate': startDate.toIso8601String(),
      'targetEndDate': targetEndDate.toIso8601String(),
      'status': status,
    };
  }
}