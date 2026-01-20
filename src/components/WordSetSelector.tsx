'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'

import { WordSet } from '@/types/wordSet'

interface WordSetSelectorProps {
  sets: WordSet[]
  selectedSetId: string | null
  selectedSetName: string | null
  onSelectMain: () => void
  onSelectSet: (id: string) => void
  onCreateSet: (name: string) => void
}

export const WordSetSelector = ({
  sets,
  selectedSetId,
  selectedSetName,
  onSelectMain,
  onSelectSet,
  onCreateSet,
}: WordSetSelectorProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const open = Boolean(anchorEl)

  const currentLabel = useMemo(() => {
    if (!selectedSetId) return 'Main set'
    return selectedSetName || 'Selected set'
  }, [selectedSetId, selectedSetName])

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => setAnchorEl(null)

  const handleOpenCreate = () => {
    setCreateOpen(true)
    setNewName('')
  }

  const handleCloseCreate = () => {
    setCreateOpen(false)
    setNewName('')
  }

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    onCreateSet(name)
    handleCloseCreate()
    handleCloseMenu()
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FolderIcon />}
        onClick={handleOpenMenu}
        sx={{
          color: 'white',
          borderColor: 'white',
          '&:hover': { borderColor: 'white' },
          textTransform: 'none',
        }}
      >
        {currentLabel}
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
        <MenuItem
          onClick={() => {
            onSelectMain()
            handleCloseMenu()
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Box sx={{ width: 20, display: 'flex', justifyContent: 'center' }}>
              {!selectedSetId ? <CheckIcon fontSize="small" /> : null}
            </Box>
            <Typography variant="body2">Main set</Typography>
          </Box>
        </MenuItem>

        {sets.length > 0 && (
          <Box sx={{ px: 2, pt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Custom sets
            </Typography>
          </Box>
        )}

        {sets.map((s) => (
          <MenuItem
            key={s.id}
            onClick={() => {
              onSelectSet(s.id)
              handleCloseMenu()
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Box sx={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                {selectedSetId === s.id ? <CheckIcon fontSize="small" /> : null}
              </Box>
              <Typography variant="body2">{s.name}</Typography>
            </Box>
          </MenuItem>
        ))}

        <MenuItem onClick={handleOpenCreate}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon fontSize="small" />
            <Typography variant="body2">Create new set…</Typography>
          </Box>
        </MenuItem>
      </Menu>

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="xs" fullWidth>
        <DialogTitle>Create word set</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Set name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Travel, Food, Business"
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
