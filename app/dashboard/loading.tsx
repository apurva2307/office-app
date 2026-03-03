export default function DashboardLoading() {
    return (
        <div className="flex flex-1 items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    Loading…
                </p>
            </div>
        </div>
    )
}
