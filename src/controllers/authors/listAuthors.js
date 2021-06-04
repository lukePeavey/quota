import createError from 'http-errors'
import slugify from '../utils/slug'
import Authors from '../../models/Authors'
import getSortParams from '../utils/getSortParams'
import getPaginationParams from '../utils/getPaginationParams'

/**
 * Get all authors that match a given query. By default, this method returns
 * a paginated list of all authors in alphabetical order.
 *
 * @param {Object} req
 * @param {Object} req.query
 * @param {string} [req.query.name] Filter authors by name. The value can be a
 *     single name or a pipe-separated list of names.
 * @param {string} [req.query.slug] Filter authors by slug. The value can be a
 *     single slug or a pipe-separated list of slugs.
 * @param {'name' | 'quoteCount'} [req.query.sortBy]
 * @param {'asc' | 'desc'} [req.query.sortOrder = 'asc']
 * @param {number} [req.query.limit = 20] Results per page
 * @param {number} [req.query.page = 0] page of results to return
 */
export default async function listAuthors(req, res, next) {
  try {
    const { name, slug } = req.query
    const { skip, limit, page } = getPaginationParams(req.query)
    const { sortBy, sortOrder } = getSortParams(req.query, {
      default: { field: 'name', order: 1 },
      name: { field: 'name', order: 1 },
      quoteCount: { field: 'quoteCount', order: -1 },
    })

    const filter = {}
    const nameOrSlug = name || slug

    if (nameOrSlug) {
      // Filter authors by `slug` or `name`. Value can be a single slug/name or // a pipe-separated list of names.
      if (/,/.test(nameOrSlug)) {
        // If value is a comma-separated list, respond with error.
        const message = 'Multiple values should be separated by a pipe.'
        return next(createError(400, message))
      }
      filter.slug = nameOrSlug.split('|').map(slugify)
    }

    // Fetch paginated results
    const [results, totalCount] = await Promise.all([
      Authors.find(filter)
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip)
        .select('-__v -aka'),
      Authors.countDocuments(filter),
    ])

    // The (1-based) index of the last result returned by this request
    const lastItemIndex = skip + results.length

    // 'totalPages' is total number of pages based on results per page
    const totalPages = Math.ceil(totalCount / limit)

    // Return a paginated list of authors
    res.status(200).json({
      count: results.length,
      totalCount,
      page,
      totalPages,
      lastItemIndex: lastItemIndex >= totalCount ? null : lastItemIndex,
      results,
    })
  } catch (error) {
    return next(error)
  }
}
