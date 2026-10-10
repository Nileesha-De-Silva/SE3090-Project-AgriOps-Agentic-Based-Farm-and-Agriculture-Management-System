import '../widgets/app_theme.dart';
import 'package:flutter/material.dart';
import '../api/component1_api.dart';
import '../models/field.dart';
import '../models/crop.dart';
import '../models/crop_season.dart';
import '../widgets/growth_stage_badge.dart';
import 'crop_season_detail_screen.dart';

class FieldDashboardScreen extends StatefulWidget {
  final Field field;

  const FieldDashboardScreen({super.key, required this.field});

  @override
  State<FieldDashboardScreen> createState() => _FieldDashboardScreenState();
}

class _FieldDashboardScreenState extends State<FieldDashboardScreen> {
  List<CropSeason> _cropSeasons = [];
  List<Crop> _crops = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        Component1Api.getCropSeasons(fieldId: widget.field.id),
        Component1Api.getCrops(),
      ]);
      setState(() {
        _cropSeasons = results[0] as List<CropSeason>;
        _crops = results[1] as List<Crop>;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  String _cropName(String cropId) {
    final match = _crops.where((c) => c.id == cropId);
    return match.isEmpty ? 'Unknown crop' : match.first.cropName;
  }

  @override
  Widget build(BuildContext context) {
    // The "active" season is whichever one is currently marked Active,
    // falling back to the most recent one if none are.
    CropSeason? activeSeason;
    if (_cropSeasons.isNotEmpty) {
      final activeMatches = _cropSeasons.where((s) => s.status == 'Active');
      activeSeason = activeMatches.isNotEmpty ? activeMatches.first : _cropSeasons.first;
    }

    return Scaffold(
      appBar: AppBar(title: Text(widget.field.fieldName)),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text('Error: $_error'))
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // The main "at a glance" dashboard card
                      Card(
                        color: AppTheme.background,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.field.fieldName,
                                style: Theme.of(context).textTheme.headlineSmall,
                              ),
                              const SizedBox(height: 4),
                              Text('${widget.field.areaSize} acres — ${widget.field.soilType}'),
                              const SizedBox(height: 12),
                              if (activeSeason != null) ...[
                                Text(
                                  _cropName(activeSeason.cropId),
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    if (activeSeason.currentGrowthStage != null)
                                      GrowthStageBadge(stage: activeSeason.currentGrowthStage!),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: activeSeason.status.toLowerCase() == 'active' ? const Color(0xFFE8F5E9) : Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: activeSeason.status.toLowerCase() == 'active' ? const Color(0xFF00E676) : Colors.grey.shade400,
                                          width: 1,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (activeSeason.status.toLowerCase() == 'active') ...[
                                            Container(
                                              width: 8,
                                              height: 8,
                                              decoration: const BoxDecoration(
                                                color: Color(0xFF00E676),
                                                shape: BoxShape.circle,
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Color(0x9900E676),
                                                    blurRadius: 5,
                                                    spreadRadius: 2,
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 5),
                                          ],
                                          Text(
                                            activeSeason.status,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: activeSeason.status.toLowerCase() == 'active' ? const Color(0xFF007E33) : Colors.grey.shade700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ] else
                                const Text('No active crop season for this field.'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      Text('Crop Seasons', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),

                      ..._cropSeasons.map((season) => Card(
                            child: ListTile(
                              title: Text(season.seasonName),
                              subtitle: Text(
                                '${_cropName(season.cropId)} — ${season.status}',
                              ),
                              trailing: season.currentGrowthStage != null
                                  ? GrowthStageBadge(stage: season.currentGrowthStage!)
                                  : null,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        CropSeasonDetailScreen(cropSeason: season),
                                  ),
                                );
                              },
                            ),
                          )),

                      if (_cropSeasons.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Text('No crop seasons yet for this field.'),
                        ),
                    ],
                  ),
      ),
    );
  }
}