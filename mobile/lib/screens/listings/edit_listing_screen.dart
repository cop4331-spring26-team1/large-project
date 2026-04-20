import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../../config/app_theme.dart';
import '../../models/listing.dart';
import '../../providers/listings_provider.dart';
import '../../services/api_service.dart';

class EditListingScreen extends StatefulWidget {
  final String listingId;
  const EditListingScreen({super.key, required this.listingId});

  @override
  State<EditListingScreen> createState() => _EditListingScreenState();
}

class _EditListingScreenState extends State<EditListingScreen> {
  Listing? _listing;
  bool _isLoading   = true;
  bool _isSubmitting = false;
  final _formKey    = GlobalKey<FormState>();
  final _api        = ApiService();

  List<String>  _existingImages = [];
  List<XFile>   _newImages      = [];
  List<Uint8List> _newPreviews  = [];

  final _titleCtrl   = TextEditingController();
  final _descCtrl    = TextEditingController();
  final _priceCtrl   = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _uniCtrl     = TextEditingController();

  List<Map<String, dynamic>> _uniSuggestions = [];
  bool _showUni           = false;
  String _selectedUniName = '';
  String _city            = '';
  String _state           = '';

  List<Map<String, dynamic>> _addressResults = [];
  bool _addressConfirmed  = false;
  bool _addressSearching  = false;
  Map<String, String>? _confirmedCoords;

  int    _bedrooms          = 1;
  bool   _petsAllowed       = false;
  bool   _utilitiesIncluded = false;
  String _status            = 'active';

  DateTime? _lastUniSearch;

  @override
  void initState() {
    super.initState();
    _loadListing();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _addressCtrl.dispose();
    _uniCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadListing() async {
    final listing = await context.read<ListingsProvider>().fetchListingById(widget.listingId);
    if (listing != null && mounted) {
      setState(() {
        _listing             = listing;
        _existingImages      = List.from(listing.images);
        _titleCtrl.text      = listing.title;
        _descCtrl.text       = listing.description;
        _priceCtrl.text      = listing.price.toStringAsFixed(0);
        _addressCtrl.text    = listing.address;
        _selectedUniName     = listing.university ?? '';
        _uniCtrl.text        = listing.university ?? '';
        _city                = listing.city;
        _state               = listing.state;
        _bedrooms            = listing.bedrooms;
        _petsAllowed         = listing.petsAllowed;
        _utilitiesIncluded   = listing.utilitiesIncluded;
        _status              = listing.status;
        _addressConfirmed    = true; // pre-confirmed for existing listing
        _isLoading           = false;
      });
    } else if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  // ── University autocomplete ──────────────────────────────────────────────────
  void _onUniChanged(String q) {
    setState(() {
      _showUni          = false;
      _selectedUniName  = '';
      _city             = '';
      _state            = '';
      _addressConfirmed = false;
      _confirmedCoords  = null;
    });
    if (q.length < 2) { setState(() => _uniSuggestions = []); return; }
    final now = DateTime.now();
    _lastUniSearch = now;
    Future.delayed(const Duration(milliseconds: 300), () async {
      if (_lastUniSearch != now) return;
      try {
        final res = await _api.get('/universities?search=${Uri.encodeComponent(q)}');
        final unis = List<Map<String, dynamic>>.from(res.data['data']['universities'] ?? []);
        if (mounted && _lastUniSearch == now) {
          setState(() { _uniSuggestions = unis; _showUni = unis.isNotEmpty; });
        }
      } catch (_) {}
    });
  }

  void _selectUni(Map<String, dynamic> u) {
    setState(() {
      _uniCtrl.text    = u['name'] ?? '';
      _selectedUniName = u['name'] ?? '';
      _city            = u['city'] ?? '';
      _state           = u['state'] ?? '';
      _showUni         = false;
      _uniSuggestions  = [];
      _addressConfirmed = false;
      _confirmedCoords  = null;
    });
  }

  // ── Address verification ────────────────────────────────────────────────────
  Future<void> _searchAddress() async {
    final addr = _addressCtrl.text.trim();
    if (addr.isEmpty || _city.isEmpty || _state.isEmpty) return;
    setState(() { _addressSearching = true; _addressResults = []; _addressConfirmed = false; _confirmedCoords = null; });
    try {
      final q = Uri.encodeComponent('$addr, $_city, $_state, USA');
      final res = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/search?q=$q&format=json&limit=5&addressdetails=1'),
        headers: {'User-Agent': 'LetsMovNow/1.0 (student-rental-app)'},
      );
      final data = List<Map<String, dynamic>>.from(jsonDecode(res.body));
      if (mounted) {
        setState(() => _addressResults = data);
        if (data.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No results found.')),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Address search failed.')),
        );
      }
    } finally {
      if (mounted) setState(() => _addressSearching = false);
    }
  }

  void _confirmAddress(Map<String, dynamic> result) {
    final addrMap  = result['address'] as Map<String, dynamic>? ?? {};
    final road     = addrMap['road'] ?? _addressCtrl.text.trim();
    final houseNum = addrMap['house_number'] != null ? '${addrMap['house_number']} ' : '';
    final city     = addrMap['city'] ?? addrMap['town'] ?? addrMap['village'] ?? _city;
    final state    = addrMap['state'] ?? _state;
    setState(() {
      _addressCtrl.text = '$houseNum$road';
      _city             = city;
      _state            = (state as String).length == 2 ? state : _state;
      _confirmedCoords  = {'lat': result['lat'], 'lon': result['lon']};
      _addressConfirmed = true;
      _addressResults   = [];
    });
  }

  // ── Images ───────────────────────────────────────────────────────────────────
  Future<void> _pickImages() async {
    final total = _existingImages.length + _newImages.length;
    if (total >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 3 photos allowed')),
      );
      return;
    }
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(imageQuality: 80, limit: 3 - total);
    if (picked.isNotEmpty) {
      final newBytes = await Future.wait(picked.map((x) => x.readAsBytes()));
      setState(() {
        _newImages   = [..._newImages, ...picked].take(3 - _existingImages.length).toList();
        _newPreviews = [..._newPreviews, ...newBytes].take(3 - _existingImages.length).toList();
      });
    }
  }

  Future<void> _removeExistingImage(String url) async {
    try {
      await _api.delete('/listings/${widget.listingId}/image', data: {'imageUrl': url});
      setState(() => _existingImages.remove(url));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to remove image')),
        );
      }
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedUniName.isEmpty && _city.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a university')),
      );
      return;
    }
    // Use pre-loaded name if not re-selected via autocomplete
    final uniName = _selectedUniName.isNotEmpty ? _selectedUniName : (_uniCtrl.text.trim());
    if (!_addressConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please verify your address first')),
      );
      return;
    }
    if (_existingImages.isEmpty && _newImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one photo')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final formData = FormData();
      formData.fields.addAll([
        MapEntry('title',             _titleCtrl.text.trim()),
        MapEntry('description',       _descCtrl.text.trim()),
        MapEntry('price',             _priceCtrl.text.trim()),
        MapEntry('bedrooms',          _bedrooms.toString()),
        MapEntry('petsAllowed',       _petsAllowed.toString()),
        MapEntry('utilitiesIncluded', _utilitiesIncluded.toString()),
        MapEntry('address',           _addressCtrl.text.trim()),
        MapEntry('city',              _city),
        MapEntry('state',             _state),
        MapEntry('university',        uniName),
      ]);
      if (_confirmedCoords != null) {
        formData.fields.add(MapEntry('confirmedLat', _confirmedCoords!['lat']!));
        formData.fields.add(MapEntry('confirmedLon', _confirmedCoords!['lon']!));
      }
      for (final img in _newImages) {
        final bytes = await img.readAsBytes();
        formData.files.add(MapEntry(
          'images',
          MultipartFile.fromBytes(bytes, filename: img.name),
        ));
      }
      await _api.putMultipart('/listings/${widget.listingId}', formData);
      // Update status separately via its own endpoint
      if (_listing!.status != _status) {
        await _api.patch('/listings/${widget.listingId}/status', data: {'status': _status});
      }
      if (mounted) {
        await context.read<ListingsProvider>().fetchMyListings();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Listing updated!')),
        );
        context.pop();
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.response?.data?['message'] ?? 'Failed to update listing')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    }
    if (_listing == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Listing')),
        body: const Center(child: Text('Listing not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Listing'),
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
                : const Text('Save', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [

            // ── University ───────────────────────────────────────
            const Text('University', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 10),
            Stack(
              clipBehavior: Clip.none,
              children: [
                TextFormField(
                  controller: _uniCtrl,
                  onChanged: _onUniChanged,
                  decoration: const InputDecoration(
                    labelText: 'University *',
                    prefixIcon: Icon(Icons.school_rounded, color: AppTheme.textSecondary, size: 20),
                  ),
                  validator: (_) => (_selectedUniName.isEmpty && _city.isEmpty) ? 'Please select a university' : null,
                ),
                if (_showUni && _uniSuggestions.isNotEmpty)
                  Positioned(
                    top: 56, left: 0, right: 0,
                    child: Material(
                      color: AppTheme.bgElevated,
                      borderRadius: BorderRadius.circular(12),
                      elevation: 8,
                      child: Column(
                        children: _uniSuggestions.map((u) => InkWell(
                          onTap: () => _selectUni(u),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: AppTheme.border.withValues(alpha: 0.5)))),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(u['name'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                                Text('${u['city']}, ${u['state']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                        )).toList(),
                      ),
                    ),
                  ),
              ],
            ),
            if (_city.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(children: [
                Expanded(flex: 2, child: TextFormField(initialValue: _city, readOnly: true, style: const TextStyle(color: AppTheme.textSecondary), decoration: const InputDecoration(labelText: 'City'))),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(initialValue: _state, readOnly: true, style: const TextStyle(color: AppTheme.textSecondary), decoration: const InputDecoration(labelText: 'State'))),
              ]),
            ],

            // ── Address ──────────────────────────────────────────
            if (_selectedUniName.isNotEmpty || _city.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text('Address', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              const SizedBox(height: 10),
              TextFormField(
                controller: _addressCtrl,
                onChanged: (_) => setState(() { _addressConfirmed = false; _confirmedCoords = null; }),
                decoration: const InputDecoration(labelText: 'Street Address *'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              if (_addressConfirmed)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: AppTheme.primary, size: 18),
                      const SizedBox(width: 8),
                      const Expanded(child: Text('Address confirmed', style: TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w600))),
                      GestureDetector(
                        onTap: () => setState(() { _addressConfirmed = false; _confirmedCoords = null; _addressResults = []; }),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(border: Border.all(color: AppTheme.primary.withValues(alpha: 0.4)), borderRadius: BorderRadius.circular(6)),
                          child: const Text('Change', style: TextStyle(fontSize: 12, color: AppTheme.primary)),
                        ),
                      ),
                    ],
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _addressSearching || _addressCtrl.text.trim().isEmpty ? null : _searchAddress,
                    icon: _addressSearching
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
                        : const Icon(Icons.search_rounded, size: 18),
                    label: Text(_addressSearching ? 'Searching...' : 'Verify Address on Map'),
                  ),
                ),
              if (_addressResults.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(color: AppTheme.bgElevated, border: Border.all(color: AppTheme.border), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(14, 10, 14, 4),
                        child: Text('Select the correct address:', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      ),
                      ..._addressResults.map((r) => InkWell(
                        onTap: () => _confirmAddress(r),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(border: Border(top: BorderSide(color: AppTheme.border.withValues(alpha: 0.5)))),
                          child: Text('📍 ${r['display_name']}', style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary)),
                        ),
                      )),
                    ],
                  ),
                ),
              ],
            ],

            // ── Basic Info ───────────────────────────────────────
            const SizedBox(height: 24),
            const Text('Basic Info', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 12),
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Title *'),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _priceCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Monthly Rent (\$) *'),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            const Text('Bedrooms', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            Row(
              children: [
                _BedroomChip(label: 'Studio', value: 0, selected: _bedrooms == 0, onTap: () => setState(() => _bedrooms = 0)),
                ...List.generate(4, (i) {
                  final val = i + 1;
                  return Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: _BedroomChip(label: '$val', value: val, selected: _bedrooms == val, onTap: () => setState(() => _bedrooms = val)),
                  );
                }),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descCtrl,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Description'),
            ),

            // ── Status ───────────────────────────────────────────
            const SizedBox(height: 24),
            const Text('Status', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 12),
            Row(children: [
              _StatusChip(label: 'Available', value: 'active',     color: const Color(0xFF34C759), selected: _status == 'active',     onTap: () => setState(() => _status = 'active')),
              const SizedBox(width: 8),
              _StatusChip(label: 'In Talks',  value: 'pending',    color: const Color(0xFFFFCC00), selected: _status == 'pending',    onTap: () => setState(() => _status = 'pending')),
              const SizedBox(width: 8),
              _StatusChip(label: 'Off Market',value: 'offMarket',  color: const Color(0xFFFF3B30), selected: _status == 'offMarket',  onTap: () => setState(() => _status = 'offMarket')),
            ]),

            // ── Amenities ────────────────────────────────────────
            const SizedBox(height: 24),
            const Text('Amenities', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 12),
            _ToggleTile(
              icon: Icons.pets_rounded,
              label: 'Pets Allowed',
              value: _petsAllowed,
              onChanged: (v) => setState(() => _petsAllowed = v),
            ),
            const SizedBox(height: 8),
            _ToggleTile(
              icon: Icons.bolt_rounded,
              label: 'Utilities Included',
              value: _utilitiesIncluded,
              onChanged: (v) => setState(() => _utilitiesIncluded = v),
            ),

            // ── Photos ───────────────────────────────────────────
            const SizedBox(height: 24),
            Row(children: [
              const Text('Photos', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              const Spacer(),
              Text('${_existingImages.length + _newImages.length}/3', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
            ]),
            const SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  if (_existingImages.length + _newImages.length < 3)
                    GestureDetector(
                      onTap: _pickImages,
                      child: Container(
                        width: 90, height: 90,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(border: Border.all(color: AppTheme.border), borderRadius: BorderRadius.circular(12), color: AppTheme.bgCard),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_rounded, color: AppTheme.primary, size: 28),
                            SizedBox(height: 4),
                            Text('Add', style: TextStyle(fontSize: 11, color: AppTheme.primary)),
                          ],
                        ),
                      ),
                    ),
                  ..._existingImages.map((url) => Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 90, height: 90,
                        margin: const EdgeInsets.only(right: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(imageUrl: url, fit: BoxFit.cover),
                        ),
                      ),
                      Positioned(
                        top: -6, right: 2,
                        child: GestureDetector(
                          onTap: () => _removeExistingImage(url),
                          child: Container(
                            width: 20, height: 20,
                            decoration: const BoxDecoration(color: AppTheme.error, shape: BoxShape.circle),
                            child: const Icon(Icons.close_rounded, color: Colors.white, size: 12),
                          ),
                        ),
                      ),
                    ],
                  )),
                  ..._newImages.asMap().entries.map((entry) => Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 90, height: 90,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: entry.key < _newPreviews.length
                              ? DecorationImage(image: MemoryImage(_newPreviews[entry.key]), fit: BoxFit.cover)
                              : null,
                        ),
                      ),
                      Positioned(
                        top: -6, right: 2,
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _newImages.removeAt(entry.key);
                            if (entry.key < _newPreviews.length) _newPreviews.removeAt(entry.key);
                          }),
                          child: Container(
                            width: 20, height: 20,
                            decoration: const BoxDecoration(color: AppTheme.error, shape: BoxShape.circle),
                            child: const Icon(Icons.close_rounded, color: Colors.white, size: 12),
                          ),
                        ),
                      ),
                    ],
                  )),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _BedroomChip extends StatelessWidget {
  final String label;
  final int value;
  final bool selected;
  final VoidCallback onTap;
  const _BedroomChip({required this.label, required this.value, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: value == 0 ? 60 : 48, height: 40,
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : AppTheme.bgInput,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? AppTheme.primary : AppTheme.border),
        ),
        alignment: Alignment.center,
        child: Text(label, style: TextStyle(fontSize: value == 0 ? 11 : 14, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppTheme.textPrimary)),
      ),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final Function(bool) onChanged;
  const _ToggleTile({required this.icon, required this.label, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: value ? AppTheme.primaryLight : AppTheme.bgInput,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: value ? AppTheme.primary : AppTheme.border),
        ),
        child: Row(
          children: [
            Icon(icon, color: value ? AppTheme.primary : AppTheme.textSecondary),
            const SizedBox(width: 12),
            Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: value ? AppTheme.primary : AppTheme.textPrimary)),
            const Spacer(),
            Switch(value: value, onChanged: onChanged, activeColor: AppTheme.primary),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool selected;
  final VoidCallback onTap;
  const _StatusChip({required this.label, required this.value, required this.color, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.15) : AppTheme.bgInput,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? color : AppTheme.border, width: selected ? 2 : 1),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: selected ? color : AppTheme.textSecondary), textAlign: TextAlign.center),
          ]),
        ),
      ),
    );
  }
}
