import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import type { File as FileType } from "../shared/schema";

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
}

interface TreeNode extends FileType {
  children?: TreeNode[];
  isExpanded?: boolean;
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/projects", "/projects/default-app", "/projects/default-app/src"]));
  const [isCreating, setIsCreating] = useState<{ type: "file" | "directory", parentPath: string } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  
  const queryClient = useQueryClient();

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/files"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; type: "file" | "directory"; parentPath: string; content: string }) => {
      return await apiRequest("POST", "/api/files", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setIsCreating(null);
      setNewItemName("");
    },
  });

  const buildFileTree = (files: FileType[]): TreeNode[] => {
    const fileMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create all nodes
    files.forEach(file => {
      fileMap.set(file.path, {
        ...file,
        children: [],
        isExpanded: expandedFolders.has(file.path),
      });
    });

    // Build tree structure
    files.forEach(file => {
      const node = fileMap.get(file.path)!;
      if (file.parentPath) {
        const parent = fileMap.get(file.parentPath);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children (directories first, then files, both alphabetically)
    const sortChildren = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children) {
          sortChildren(node.children);
        }
      });
      
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    return sortChildren(rootNodes);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleCreateItem = (type: "file" | "directory", parentPath: string) => {
    setIsCreating({ type, parentPath });
    setNewItemName("");
  };

  const handleCreateSubmit = () => {
    if (!newItemName.trim() || !isCreating) return;

    const path = isCreating.parentPath === "/" ? `/${newItemName}` : `${isCreating.parentPath}/${newItemName}`;
    const content = isCreating.type === "file" ? "" : "";

    createFileMutation.mutate({
      name: newItemName,
      path,
      type: isCreating.type,
      parentPath: isCreating.parentPath,
      content,
    });
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:rde-bg-accent rounded cursor-pointer text-sm group transition-colors ${
            node.type === "file" ? "rde-text-primary" : "rde-text-secondary"
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (node.type === "directory") {
              toggleFolder(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === "directory" ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 rde-text-secondary mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 rde-text-secondary mr-1" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400 mr-2" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400 mr-2" />
              )}
            </>
          ) : (
            <File className="w-4 h-4 rde-text-secondary mr-2 ml-5" />
          )}
          <span className="flex-1">{node.name}</span>
          
          {/* Action buttons for directories */}
          {node.type === "directory" && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:rde-bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateItem("file", node.path);
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:rde-bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateItem("directory", node.path);
                }}
              >
                <Folder className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Create new item input */}
        {isCreating && isCreating.parentPath === node.path && (
          <div style={{ paddingLeft: `${paddingLeft + 20}px` }} className="py-1">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${isCreating.type} name`}
              className="text-xs h-6 rde-bg-primary rde-border rde-text-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateSubmit();
                } else if (e.key === "Escape") {
                  setIsCreating(null);
                  setNewItemName("");
                }
              }}
              onBlur={() => {
                if (newItemName.trim()) {
                  handleCreateSubmit();
                } else {
                  setIsCreating(null);
                }
              }}
              autoFocus
            />
          </div>
        )}

        {/* Render children */}
        {node.type === "directory" && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree(Array.isArray(files) ? files : []);

  return (
    <div className="w-full h-full rde-bg-secondary border-r rde-border flex flex-col">
      {/* Explorer Header */}
      <div className="px-4 py-3 border-b rde-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium rde-text-primary">EXPLORER</h3>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:rde-bg-accent"
              onClick={() => handleCreateItem("file", "/projects")}
              title="New File"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:rde-bg-accent"
              onClick={() => handleCreateItem("directory", "/projects")}
              title="New Folder"
            >
              <Folder className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:rde-bg-accent"
              onClick={() => refetch()}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {isLoading ? (
          <div className="text-sm rde-text-secondary p-2">Loading files...</div>
        ) : (
          <div className="space-y-1">
            {fileTree.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}
