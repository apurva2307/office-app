'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function AuditLogTable({ logs, filterUserId }: { logs: any[], filterUserId?: string }) {
    const filteredLogs = filterUserId
        ? logs.filter(log => log.userId === filterUserId)
        : logs

    if (!filteredLogs || filteredLogs.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No audit logs found{filterUserId ? " for this user" : ""}.</div>
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800'
            case 'UPDATE': return 'bg-blue-100 text-blue-800'
            case 'DELETE': return 'bg-red-100 text-red-800'
            case 'APPROVE': return 'bg-purple-100 text-purple-800'
            case 'REJECT': return 'bg-orange-100 text-orange-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLogs.map((log) => {
                        let metadata = {}
                        try {
                            metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata
                        } catch (e) {
                            metadata = { data: log.metadata }
                        }

                        return (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap text-xs">
                                    {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{log.user?.fullName}</span>
                                        <span className="text-[10px] text-muted-foreground">{log.user?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getActionColor(log.action)}>
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-xs">{log.entityType}</TableCell>
                                <TableCell className="text-[10px] font-mono text-muted-foreground">
                                    {log.entityId?.slice(-6) || '-'}
                                </TableCell>
                                <TableCell>
                                    <pre className="text-[10px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap bg-gray-50 p-1 rounded">
                                        {JSON.stringify(metadata)}
                                    </pre>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
