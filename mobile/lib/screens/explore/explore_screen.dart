import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../config/app_theme.dart';
import '../../providers/listings_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/listing_card.dart';
import '../../widgets/filter_bottom_sheet.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  final _searchFocus      = FocusNode();
  final _api              = ApiService();

  List<Map<String, dynamic>> _suggestions = [];
  bool _showSuggestions  = false;
  bool _ignoreNextChange = false; // prevents onChanged firing on programmatic setText
  DateTime? _lastSearch;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ListingsProvider>().fetchListings(reset: true);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_showSuggestions) setState(() => _showSuggestions = false);
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      context.read<ListingsProvider>().fetchListings();
    }
  }

  void _onSearchChanged(String q) {
    // Skip if we set the text ourselves
    if (_ignoreNextChange) { _ignoreNextChange = false; return; }

    if (q.isEmpty) {
      setState(() { _suggestions = []; _showSuggestions = false; });
      context.read<ListingsProvider>().clearUniversity();
      return;
    }
    if (q.length < 2) {
      setState(() { _suggestions = []; _showSuggestions = false; });
      return;
    }

    final now = DateTime.now();
    _lastSearch = now;
    Future.delayed(const Duration(milliseconds: 300), () async {
      if (_lastSearch != now || !mounted) return;
      try {
        final res  = await _api.get('/universities?search=${Uri.encodeComponent(q)}');
        final unis = List<Map<String, dynamic>>.from(res.data['data']['universities'] ?? []);
        if (mounted && _lastSearch == now) {
          setState(() { _suggestions = unis; _showSuggestions = unis.isNotEmpty; });
        }
      } catch (_) {}
    });
  }

  void _selectUniversity(Map<String, dynamic> uni) {
    // Set text WITHOUT triggering onChanged
    _ignoreNextChange = true;
    _searchController.text = uni['name'] ?? '';
    _searchFocus.unfocus();
    setState(() { _showSuggestions = false; _suggestions = []; });
    context.read<ListingsProvider>().selectUniversity(uni);
  }

  void _clearSearch() {
    _ignoreNextChange = true;
    _searchController.clear();
    _searchFocus.unfocus();
    setState(() { _showSuggestions = false; _suggestions = []; });
    context.read<ListingsProvider>().clearUniversity();
  }

  @override
  Widget build(BuildContext context) {
    final provider    = context.watch<ListingsProvider>();
    final filterCount = provider.filters.activeFilterCount;
    final selected    = provider.selectedUniversity;

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ───────────────────────────────────────────
            Container(
              color: AppTheme.bgCard,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Column(
                children: [
                  Row(children: [
                    const Text('LetsMovNow',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                            color: AppTheme.primary, letterSpacing: -0.5)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => context.push('/map'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.bgInput,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: const Row(children: [
                          Icon(Icons.map_outlined, size: 16, color: AppTheme.primary),
                          SizedBox(width: 4),
                          Text('Map', style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                      child: Column(
                        children: [
                          // Search field
                          Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTheme.bgInput,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected != null ? AppTheme.primary : AppTheme.border,
                              ),
                            ),
                            child: Row(children: [
                              const Padding(
                                padding: EdgeInsets.only(left: 12),
                                child: Icon(Icons.school_rounded, color: AppTheme.textLight, size: 20),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _searchController,
                                  focusNode:  _searchFocus,
                                  onChanged:  _onSearchChanged,
                                  style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary),
                                  decoration: const InputDecoration(
                                    hintText: 'Search by university...',
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                    hintStyle: TextStyle(color: AppTheme.textLight, fontSize: 14),
                                  ),
                                ),
                              ),
                              if (_searchController.text.isNotEmpty)
                                GestureDetector(
                                  onTap: _clearSearch,
                                  child: const Padding(
                                    padding: EdgeInsets.only(right: 10),
                                    child: Icon(Icons.close_rounded, color: AppTheme.textLight, size: 18),
                                  ),
                                ),
                            ]),
                          ),

                          // Suggestions — inline below search, not overlaid
                          if (_showSuggestions && _suggestions.isNotEmpty)
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.bgElevated,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.border),
                                boxShadow: [BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.4),
                                  blurRadius: 12, offset: const Offset(0, 4),
                                )],
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: _suggestions.take(6).toList().asMap().entries.map((entry) {
                                  final u = entry.value;
                                  final isLast = entry.key == (_suggestions.length > 6 ? 5 : _suggestions.length - 1);
                                  return GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => _selectUniversity(u),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      decoration: isLast ? null : BoxDecoration(
                                        border: Border(bottom: BorderSide(color: AppTheme.border.withValues(alpha: 0.5))),
                                      ),
                                      child: Row(children: [
                                        const Icon(Icons.school_rounded, size: 16, color: AppTheme.primary),
                                        const SizedBox(width: 10),
                                        Expanded(child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(u['name'] ?? '',
                                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                                            Text('${u['city']}, ${u['state']}',
                                                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                          ],
                                        )),
                                      ]),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: () {
                        setState(() => _showSuggestions = false);
                        final provider = context.read<ListingsProvider>();
                        FilterBottomSheet.show(context,
                          initialFilters: provider.filters,
                          onApply: (f) => provider.setFilters(f),
                        );
                      },
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(
                              color: filterCount > 0 ? AppTheme.primaryLight : AppTheme.bgInput,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: filterCount > 0 ? AppTheme.primary : AppTheme.border),
                            ),
                            child: Icon(Icons.tune_rounded,
                                color: filterCount > 0 ? AppTheme.primary : AppTheme.textSecondary, size: 20),
                          ),
                          if (filterCount > 0)
                            Positioned(
                              top: -4, right: -4,
                              child: Container(
                                width: 16, height: 16,
                                decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                alignment: Alignment.center,
                                child: Text('$filterCount',
                                    style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ]),
                  // Selected university chip
                  if (selected != null) ...[
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.4)),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.location_on_rounded, size: 12, color: AppTheme.primary),
                          const SizedBox(width: 4),
                          Text('${selected['city']}, ${selected['state']}',
                              style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // ── Listings ─────────────────────────────────────────
            Expanded(child: GestureDetector(
              onTap: () { if (_showSuggestions) setState(() => _showSuggestions = false); },
              child: _ListingsBody(scrollController: _scrollController),
            )),
          ],
        ),
      ),
    );
  }
}

class _ListingsBody extends StatelessWidget {
  final ScrollController scrollController;
  const _ListingsBody({required this.scrollController});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ListingsProvider>();

    if (provider.isLoading) return _ShimmerGrid();

    if (provider.error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.wifi_off_rounded, size: 48, color: AppTheme.textLight),
        const SizedBox(height: 12),
        Text(provider.error!, style: const TextStyle(color: AppTheme.textSecondary)),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () => context.read<ListingsProvider>().fetchListings(reset: true),
          child: const Text('Try Again'),
        ),
      ]));
    }

    if (provider.listings.isEmpty) {
      return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.home_outlined, size: 48, color: AppTheme.textLight),
        SizedBox(height: 12),
        Text('No listings found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
        SizedBox(height: 4),
        Text('Try a different university or adjust filters', style: TextStyle(color: AppTheme.textSecondary)),
      ]));
    }

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: Row(children: [
          Text('${provider.totalCount} listing${provider.totalCount == 1 ? '' : 's'} found',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
        ]),
      ),
      Expanded(child: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () => context.read<ListingsProvider>().fetchListings(reset: true),
        child: GridView.builder(
        controller: scrollController,
        padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.of(context).padding.bottom + 100),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 1, mainAxisSpacing: 12, childAspectRatio: 1.1,
        ),
        itemCount: provider.listings.length + (provider.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == provider.listings.length) {
            return const Center(child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
            ));
          }
          return ListingCard(listing: provider.listings[index]);
        },
      ))),
    ]);
  }
}

class _ShimmerGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.bgCard,
      highlightColor: AppTheme.bgElevated,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          margin: const EdgeInsets.only(bottom: 16),
          height: 300,
          decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
