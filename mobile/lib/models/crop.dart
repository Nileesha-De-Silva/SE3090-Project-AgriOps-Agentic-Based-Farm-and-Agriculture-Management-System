class Crop {
  final String id;
  final String cropName;
  final String variety;
  final int optimalGrowthDurationDays;
  final String? description;

  Crop({
    required this.id,
    required this.cropName,
    required this.variety,
    required this.optimalGrowthDurationDays,
    this.description,
  });

  factory Crop.fromJson(Map<String, dynamic> json) {
    return Crop(
      id: json['id'],
      cropName: json['cropName'],
      variety: json['variety'],
      optimalGrowthDurationDays: json['optimalGrowthDurationDays'],
      description: json['description'],
    );
  }
}