import { supabase } from '$lib/supabase/client';
import { getUserCategories } from './categories';
import { getItems } from './category-items';
import type { Category, CategoryItem } from '$lib/types/category';

export interface OverallStats {
    totalCategories: number;
    totalItems: number;
    categoriesWithItems: number;
    averageItemsPerCategory: number;
}

export interface TimeSeriesDataPoint {
    date: string;
    count: number;
}

export interface CategoryDistribution {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    count: number;
    percentage: number;
}

export interface RatingDistribution {
    rating: number;
    count: number;
}

export interface Insight {
    type: 'stat' | 'achievement' | 'trend';
    icon: string;
    title: string;
    value: string | number;
    description: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
}

export interface AnalyticsData {
    overallStats: OverallStats;
    timeSeries: TimeSeriesDataPoint[];
    categoryDistribution: CategoryDistribution[];
    ratingDistribution: RatingDistribution[];
    insights: Insight[];
}

/**
 * Get overall statistics
 */
export async function getOverallStats(): Promise<OverallStats> {
    const categories = await getUserCategories();
    const totalCategories = categories.length;

    let totalItems = 0;
    let categoriesWithItems = 0;

    for (const category of categories) {
        const items = await getItems(category.id);
        if (items.length > 0) {
            categoriesWithItems++;
            totalItems += items.length;
        }
    }

    return {
        totalCategories,
        totalItems,
        categoriesWithItems,
        averageItemsPerCategory: totalCategories > 0 ? totalItems / totalCategories : 0
    };
}

/**
 * Get time series data for items added over time
 * @param period - Time period ('7d', '30d', '90d', '1y', 'all')
 */
export async function getTimeSeriesData(period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'): Promise<TimeSeriesDataPoint[]> {
    const categories = await getUserCategories();
    if (categories.length === 0) return [];

    // Get all items
    const allItemsPromises = categories.map(cat => getItems(cat.id));
    const allItems = (await Promise.all(allItemsPromises)).flat();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
            if (allItems.length > 0) {
                const oldestItem = allItems.reduce((oldest, item) => {
                    const itemDate = new Date(item.created_at);
                    return itemDate < oldest ? itemDate : oldest;
                }, new Date());
                startDate = oldestItem;
            }
            break;
    }

    // Group items by date
    const dateCounts = new Map<string, number>();

    for (const item of allItems) {
        const itemDate = new Date(item.created_at);
        if (itemDate >= startDate) {
            const dateKey = itemDate.toISOString().split('T')[0]; // YYYY-MM-DD
            dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
        }
    }

    // Fill in missing dates with 0
    const result: TimeSeriesDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
        const dateKey = currentDate.toISOString().split('T')[0];
        result.push({
            date: dateKey,
            count: dateCounts.get(dateKey) || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
}

/**
 * Get category distribution
 */
export async function getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const categories = await getUserCategories();
    if (categories.length === 0) return [];

    const distribution: CategoryDistribution[] = [];
    let totalItems = 0;

    for (const category of categories) {
        const items = await getItems(category.id);
        const count = items.length;
        totalItems += count;

        distribution.push({
            categoryId: category.id,
            categoryName: category.name,
            categoryIcon: category.icon || '📁',
            categoryColor: category.color || '#60a5fa',
            count,
            percentage: 0 // Will calculate after we know total
        });
    }

    // Calculate percentages
    for (const item of distribution) {
        item.percentage = totalItems > 0 ? (item.count / totalItems) * 100 : 0;
    }

    // Sort by count descending
    return distribution.sort((a, b) => b.count - a.count);
}

/**
 * Get rating distribution (histogram of ratings)
 */
export async function getRatingDistribution(): Promise<RatingDistribution[]> {
    const categories = await getUserCategories();
    if (categories.length === 0) return [];

    const allItemsPromises = categories.map(cat => getItems(cat.id));
    const allItems = (await Promise.all(allItemsPromises)).flat();

    // Count ratings
    const ratingCounts = new Map<number, number>();

    for (const item of allItems) {
        const rating = item.data.rating;
        if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
            ratingCounts.set(rating, (ratingCounts.get(rating) || 0) + 1);
        }
    }

    // Fill in all ratings 1-5
    const distribution: RatingDistribution[] = [];
    for (let rating = 1; rating <= 5; rating++) {
        distribution.push({
            rating,
            count: ratingCounts.get(rating) || 0
        });
    }

    return distribution;
}

/**
 * Calculate activity streak (consecutive days with activity)
 */
function calculateStreak(items: CategoryItem[]): number {
    if (items.length === 0) return 0;

    // Get unique dates sorted
    const dates = new Set<string>();
    for (const item of items) {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        dates.add(date);
    }

    const sortedDates = Array.from(dates).sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === streak) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Generate insights based on analytics data
 */
export async function getInsights(): Promise<Insight[]> {
    const categories = await getUserCategories();
    if (categories.length === 0) return [];

    const insights: Insight[] = [];

    // Get all items
    const allItemsPromises = categories.map(cat => getItems(cat.id));
    const allItems = (await Promise.all(allItemsPromises)).flat();

    // Total items insight
    insights.push({
        type: 'stat',
        icon: '📊',
        title: 'Total Items Tracked',
        value: allItems.length,
        description: `Across ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`
    });

    // Most active category
    const distribution = await getCategoryDistribution();
    if (distribution.length > 0 && distribution[0].count > 0) {
        insights.push({
            type: 'stat',
            icon: distribution[0].categoryIcon,
            title: 'Most Active Category',
            value: distribution[0].categoryName,
            description: `${distribution[0].count} items (${distribution[0].percentage.toFixed(1)}%)`
        });
    }

    // Average rating
    const ratings = allItems.filter(item => typeof item.data.rating === 'number');
    if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, item) => sum + (item.data.rating as number), 0) / ratings.length;
        insights.push({
            type: 'stat',
            icon: '⭐',
            title: 'Average Rating',
            value: avgRating.toFixed(1),
            description: `Based on ${ratings.length} rated ${ratings.length === 1 ? 'item' : 'items'}`
        });
    }

    // Activity streak
    const streak = calculateStreak(allItems);
    if (streak > 0) {
        insights.push({
            type: 'achievement',
            icon: '🔥',
            title: 'Current Streak',
            value: `${streak} ${streak === 1 ? 'day' : 'days'}`,
            description: 'Keep it up!'
        });
    }

    // Items this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const itemsThisMonth = allItems.filter(item => new Date(item.created_at) >= firstDayOfMonth);

    if (itemsThisMonth.length > 0) {
        insights.push({
            type: 'stat',
            icon: '📅',
            title: 'This Month',
            value: itemsThisMonth.length,
            description: `${itemsThisMonth.length} ${itemsThisMonth.length === 1 ? 'item' : 'items'} added`
        });
    }

    // Completion rate (if status field exists)
    const itemsWithStatus = allItems.filter(item => item.data.status);
    const completedItems = itemsWithStatus.filter(item =>
        item.data.status && item.data.status.toLowerCase().includes('complete')
    );

    if (itemsWithStatus.length > 0) {
        const completionRate = (completedItems.length / itemsWithStatus.length) * 100;
        insights.push({
            type: 'stat',
            icon: '✅',
            title: 'Completion Rate',
            value: `${completionRate.toFixed(0)}%`,
            description: `${completedItems.length} of ${itemsWithStatus.length} completed`
        });
    }

    return insights;
}

/**
 * Get all analytics data at once
 */
export async function getAllAnalytics(period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'): Promise<AnalyticsData> {
    const [overallStats, timeSeries, categoryDistribution, ratingDistribution, insights] = await Promise.all([
        getOverallStats(),
        getTimeSeriesData(period),
        getCategoryDistribution(),
        getRatingDistribution(),
        getInsights()
    ]);

    return {
        overallStats,
        timeSeries,
        categoryDistribution,
        ratingDistribution,
        insights
    };
}
