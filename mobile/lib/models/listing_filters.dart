class ListingFilters {
  final String? search;
  final String? university;
  final String? city;
  final String? state;
  final int?    minPrice;
  final int?    maxPrice;
  final int?    bedrooms;

  const ListingFilters({
    this.search,
    this.university,
    this.city,
    this.state,
    this.minPrice,
    this.maxPrice,
    this.bedrooms,
  });

  static const empty = ListingFilters();

  int get activeFilterCount {
    int count = 0;
    if (university != null && university!.isNotEmpty) count++;
    if (city       != null && city!.isNotEmpty)       count++;
    if (state      != null && state!.isNotEmpty)       count++;
    if (minPrice   != null)                            count++;
    if (maxPrice   != null)                            count++;
    if (bedrooms   != null)                            count++;
    return count;
  }

  ListingFilters copyWith({
    String? search, String? university, String? city, String? state,
    int? minPrice, int? maxPrice, int? bedrooms,
  }) => ListingFilters(
    search:     search     ?? this.search,
    university: university ?? this.university,
    city:       city       ?? this.city,
    state:      state      ?? this.state,
    minPrice:   minPrice   ?? this.minPrice,
    maxPrice:   maxPrice   ?? this.maxPrice,
    bedrooms:   bedrooms   ?? this.bedrooms,
  );

  Map<String, dynamic> toQueryParams() => {
    if (search     != null && search!.isNotEmpty)     'search':     search,
    if (university != null && university!.isNotEmpty) 'university': university,
    if (city       != null && city!.isNotEmpty)       'city':       city,
    if (state      != null && state!.isNotEmpty)      'state':      state,
    if (minPrice   != null)                           'minPrice':   minPrice,
    if (maxPrice   != null)                           'maxPrice':   maxPrice,
    if (bedrooms   != null)                           'bedrooms':   bedrooms,
  };
}
