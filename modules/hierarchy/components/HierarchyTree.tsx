'use client'

import { useState } from "react"
import { ChevronRight, ChevronDown, User, Trash2, Shield, Briefcase, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { removeMapping } from "@/modules/hierarchy/actions"
import { useRouter } from "next/navigation"

type HierarchyNode = {
    id: string
    fullName: string
    email: string
    globalRole: string
    department: string | null
    children: HierarchyNode[]
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Crown },
    ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Shield },
    SECTION_OFFICER: { label: "Section Officer", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Briefcase },
    EMPLOYEE: { label: "Employee", color: "bg-gray-100 text-gray-700 border-gray-200", icon: User },
}

function TreeNode({
    node,
    depth = 0,
    mappingIds,
    canManage,
}: {
    node: HierarchyNode
    depth?: number
    mappingIds: Map<string, string> // subordinateId → mappingId
    canManage: boolean
}) {
    const [expanded, setExpanded] = useState(depth < 2)
    const [removing, setRemoving] = useState(false)
    const router = useRouter()
    const hasChildren = node.children.length > 0
    const roleConfig = ROLE_CONFIG[node.globalRole] || ROLE_CONFIG.EMPLOYEE
    const RoleIcon = roleConfig.icon

    async function handleRemove() {
        const mappingId = mappingIds.get(node.id)
        if (!mappingId) return
        setRemoving(true)
        try {
            await removeMapping(mappingId)
            router.refresh()
        } catch (err) {
            console.error(err)
        } finally {
            setRemoving(false)
        }
    }

    return (
        <div style={{ marginLeft: depth * 24 }}>
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group transition-colors">
                {/* Expand/Collapse */}
                {hasChildren ? (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                    >
                        {expanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>
                ) : (
                    <span className="w-5 h-5 flex-shrink-0" />
                )}

                {/* User Info */}
                <span className="font-medium text-sm text-gray-900">{node.fullName}</span>
                <span className="text-xs text-gray-400 hidden sm:inline">{node.email}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleConfig.color}`}>
                    {roleConfig.label}
                </Badge>
                {node.department && (
                    <span className="text-xs text-gray-400">{node.department}</span>
                )}

                {/* Remove Button (only if not root and has a mapping) */}
                {canManage && depth > 0 && mappingIds.has(node.id) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        onClick={handleRemove}
                        disabled={removing}
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div className="border-l border-gray-200 ml-4">
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            mappingIds={mappingIds}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function HierarchyTree({
    tree,
    mappings,
    canManage,
}: {
    tree: HierarchyNode | null
    mappings: { id: string; subordinateId: string }[]
    canManage: boolean
}) {
    if (!tree) {
        return (
            <div className="text-center py-12 text-gray-400">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hierarchy data found.</p>
            </div>
        )
    }

    // Build lookup: subordinateId → mappingId for remove buttons
    const mappingIds = new Map<string, string>()
    for (const m of mappings) {
        mappingIds.set(m.subordinateId, m.id)
    }

    return (
        <div className="py-2">
            <TreeNode node={tree} mappingIds={mappingIds} canManage={canManage} />
        </div>
    )
}
