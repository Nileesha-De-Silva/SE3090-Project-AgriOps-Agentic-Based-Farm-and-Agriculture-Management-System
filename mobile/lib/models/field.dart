class Field {
  final String id;
  final String farmId;
  final String fieldName;
  final double areaSize;
  final String soilType;
  final String? boundaryCoordinates;

  Field({
    required this.id,
    required this.farmId,
    required this.fieldName,
    required this.areaSize,
    required this.soilType,
    this.boundaryCoordinates,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      id: json['id'],
      farmId: json['farmId'],
      fieldName: json['fieldName'],
      areaSize: (json['areaSize'] as num).toDouble(),
      soilType: json['soilType'],
      boundaryCoordinates: json['boundaryCoordinates'],
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'farmId': farmId,
      'fieldName': fieldName,
      'areaSize': areaSize,
      'soilType': soilType,
      'boundaryCoordinates': boundaryCoordinates,
    };
  }
}