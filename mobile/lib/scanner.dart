import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'api.dart';

class ScannerScreen extends StatefulWidget {
  final Set<String> inventoryIds;
  const ScannerScreen({super.key, required this.inventoryIds});
  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool finished = false, cameraEnabled = false;
  String? error;
  final manual = TextEditingController();
  late final Set<String> knownIds;

  @override
  void initState() {
    super.initState();
    knownIds = widget.inventoryIds.map((id) => id.toLowerCase()).toSet();
  }

  void accept(String value) {
    if (finished) return;
    final id = itemIdFromCode(value);
    if (id == null) {
      setState(() => error = 'This is not an AgriOps inventory label. Scan an item label or enter its inventory ID.');
      return;
    }
    if (!knownIds.contains(id)) {
      setState(() => error = 'Item not found in your loaded inventory. Go back, refresh inventory and try again.');
      return;
    }
    finished = true;
    Navigator.of(context).pop(id);
  }

  void detected(BarcodeCapture capture) {
    if (finished) return;
    final values = capture.barcodes.map((barcode) => barcode.rawValue)
      .whereType<String>().where((value) => value.trim().isNotEmpty).toList();
    // Prefer a recognised item when the camera sees several labels at once.
    for (final value in values) {
      final id = itemIdFromCode(value);
      if (id != null && knownIds.contains(id)) {
        accept(value);
        return;
      }
    }
    if (values.isNotEmpty) accept(values.first);
  }

  @override
  void dispose() { manual.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Scan inventory label')),
    body: SafeArea(child: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('Scan the AgriOps QR label on a container or shelf to open its inventory record.'),
      const SizedBox(height: 8),
      const Text('Scanning does not change stock. Enter the amount used or received on the item screen.'),
      if (knownIds.isEmpty) const Padding(padding: EdgeInsets.symmetric(vertical: 12),
        child: Text('No inventory items are loaded. Go back and refresh before scanning.')),
      const SizedBox(height: 16),
      if (cameraEnabled) ...[
        SizedBox(height: 260, child: MobileScanner(
          onDetect: detected,
          errorBuilder: (context, error) => const Center(
            child: Text('Camera unavailable or permission denied. Use manual entry below.')),
        )),
        TextButton.icon(onPressed: () => setState(() => cameraEnabled = false),
          icon: const Icon(Icons.videocam_off_outlined), label: const Text('Stop camera')),
      ] else
        OutlinedButton.icon(onPressed: knownIds.isEmpty ? null : () => setState(() => cameraEnabled = true),
          icon: const Icon(Icons.qr_code_scanner), label: const Text('Start camera')),
      const SizedBox(height: 20),
      TextField(controller: manual, autocorrect: false, enableSuggestions: false,
        decoration: const InputDecoration(labelText: 'Inventory ID or QR label text',
          helperText: 'Use manual entry if the camera is unavailable.', helperMaxLines: 2)),
      if (error != null) Padding(padding: const EdgeInsets.symmetric(vertical: 12),
        child: Semantics(liveRegion: true, child: Text(error!))),
      const SizedBox(height: 12),
      FilledButton(onPressed: knownIds.isEmpty ? null : () => accept(manual.text),
        child: const Text('Open item')),
    ])),
  );
}

class InventoryQrLabelScreen extends StatelessWidget {
  final String itemId, itemName;
  const InventoryQrLabelScreen({super.key, required this.itemId, required this.itemName});

  @override
  Widget build(BuildContext context) {
    final id = itemIdFromCode(itemId);
    final payload = id == null ? null : 'agriops:item:$id';
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory QR label')),
      body: SafeArea(child: Center(child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: ListView(shrinkWrap: true, padding: const EdgeInsets.all(20), children: [
          if (payload == null)
            const Text('This item has an invalid inventory ID. Refresh inventory before creating its label.')
          else ...[
            Container(color: Colors.white, padding: const EdgeInsets.all(16),
              child: Column(children: [
                const Text('AgriOps inventory', style: TextStyle(color: Colors.black)),
                const SizedBox(height: 8),
                Text(itemName, textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.black, fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                LayoutBuilder(builder: (context, constraints) {
                  final size = constraints.maxWidth.clamp(0.0, 280.0).toDouble();
                  return QrImageView(data: payload, version: QrVersions.auto,
                    size: size, padding: const EdgeInsets.all(20), backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                    dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                    semanticsLabel: 'Inventory QR label for $itemName',
                    errorStateBuilder: (context, error) => const Text('Could not generate this label.'));
                }),
                const SizedBox(height: 8),
                SelectableText(id!, textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.black, fontSize: 12)),
              ])),
            const SizedBox(height: 16),
            const Text('Capture this label with a screenshot to print or display on another device. Keep the white border around the QR code.'),
            const SizedBox(height: 8),
            const Text('Attach it to the matching container or shelf. Scanning opens the item; it does not change stock.'),
            const SizedBox(height: 12),
            OutlinedButton.icon(icon: const Icon(Icons.copy_outlined), label: const Text('Copy label text'),
              onPressed: () async {
                try {
                  await Clipboard.setData(ClipboardData(text: payload));
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inventory label text copied')));
                } catch (_) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not copy. Use the item ID shown on the label.')));
                }
              }),
          ],
        ]),
      ))),
    );
  }
}
