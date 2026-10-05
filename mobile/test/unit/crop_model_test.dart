import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/models/crop.dart';
import 'package:agriops_mobile/models/crop_season.dart';

void main() {
  group('Crop & CropSeason Model Unit Tests (Component 1)', () {
    test('Crop.fromJson parses fields correctly', () {
      final json = {
        'id': 'crop-tomato-1',
        'cropName': 'Tomato',
        'variety': 'Thilina (Hybrid)',
        'optimalGrowthDurationDays': 90,
        'description': 'High-yield tropical tomato variety',
      };

      final crop = Crop.fromJson(json);

      expect(crop.id, 'crop-tomato-1');
      expect(crop.cropName, 'Tomato');
      expect(crop.variety, 'Thilina (Hybrid)');
      expect(crop.optimalGrowthDurationDays, 90);
      expect(crop.description, 'High-yield tropical tomato variety');
    });

    test('CropSeason.fromJson parses dates and status', () {
      final json = {
        'id': 'season-2026-01',
        'fieldId': 'field-north-1',
        'cropId': 'crop-tomato-1',
        'seasonName': 'Yala Season 2026',
        'startDate': '2026-05-01T00:00:00.000Z',
        'targetEndDate': '2026-08-01T00:00:00.000Z',
        'status': 'Active',
        'currentGrowthStage': 'Flowering',
      };

      final season = CropSeason.fromJson(json);

      expect(season.id, 'season-2026-01');
      expect(season.seasonName, 'Yala Season 2026');
      expect(season.status, 'Active');
      expect(season.currentGrowthStage, 'Flowering');
      expect(season.startDate.year, 2026);
    });

    test('CropSeason.toCreateJson formats ISO8601 strings', () {
      final season = CropSeason(
        id: 'temp-id',
        fieldId: 'field-north-1',
        cropId: 'crop-tomato-1',
        seasonName: 'Maha Season 2026',
        startDate: DateTime(2026, 10, 1),
        targetEndDate: DateTime(2027, 2, 1),
        status: 'Planned',
      );

      final payload = season.toCreateJson();

      expect(payload['seasonName'], 'Maha Season 2026');
      expect(payload['status'], 'Planned');
      expect(payload['startDate'], contains('2026-10-01'));
      expect(payload['targetEndDate'], contains('2027-02-01'));
    });
  });
}
