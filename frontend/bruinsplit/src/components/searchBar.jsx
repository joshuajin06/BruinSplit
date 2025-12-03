import { useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBar({ onSearch }) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setSearchQuery('');
        onSearch('');
    };

    return (
        <TextField
            fullWidth
            variant="outlined"
            placeholder="Search rides by origin or destination..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
                backgroundColor: 'white',
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                }
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
                endAdornment: searchQuery && (
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="clear search"
                            onClick={handleClear}
                            edge="end"
                            size="small"
                        >
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                )
            }}
        />
    );
}
