import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import {
    Button,
    ButtonGroup,
    Container, Drawer,
    IconButton, List,
    ListItemButton,
    ListItemText,
    Typography,
    useMediaQuery
} from '@mui/material';
import {Link, NavLink} from 'react-router-dom';
import {useTheme} from '@mui/material/styles';
import useLogout from "../../hooks/useLogout.ts";
import {useState} from "react";
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import useAuth from "../../hooks/useAuth.ts";
import {Role, RoleValues} from "../../models/user.ts";

const pathAndTitle: Record<string, {role: Role, label: string}> = {
    'dashboard': {role: RoleValues.REGULAR, label: 'Dashboard'},
    'products': {role: RoleValues.REGULAR, label: 'Products'},
    'users': {role: RoleValues.ADMIN, label: 'Users'},
    'customers': {role: RoleValues.REGULAR, label: 'Customers'},
    'categories': {role: RoleValues.REGULAR, label: 'Categories'},
    'offers': {role: RoleValues.REGULAR, label: 'Offers'},
};

export function Navbar() {
    const theme = useTheme();
    const { logout } = useLogout();

    const handleLogout = async () => {
        await logout()
    }

    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const {auth} = useAuth();

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    const menuItems = Object.keys(pathAndTitle).map((path) => (
        pathAndTitle[path].role === auth?.role ?
            (<ListItemButton component={NavLink} to={path} key={path} onClick={toggleDrawer(false)}>
                <ListItemText primary={pathAndTitle[path].label} />
            </ListItemButton>) : undefined
    ));

    return (
        <AppBar position="static" sx={{ width: '100%' }} color="primary">
            <Container disableGutters>
                <Toolbar>
                    <Typography
                        variant="h6"
                        component={Link}
                        to="dashboard"
                        sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
                    >
                        Customer support
                    </Typography>
                    {isMobile ? (
                        <>
                            <IconButton color="inherit" onClick={toggleDrawer(true)}>
                                <DensityMediumIcon />
                            </IconButton>
                            <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)} >
                                <Typography sx={{m: 2}}> Logged as {auth?.displayName} ({auth?.email})</Typography>
                                <List>
                                    {menuItems}
                                    <ListItemButton component={Link} to="/login" onClick={handleLogout}>
                                        <ListItemText primary="Log Out" />
                                    </ListItemButton>
                                </List>
                            </Drawer>
                        </>
                    ) : (
                        <>
                            <ButtonGroup variant="text" color="inherit">
                                {Object.keys(pathAndTitle).map((path) => (
                                    <Button
                                        key={path}
                                        component={NavLink}
                                        to={path}
                                        sx={{
                                            px: 3,
                                            '&.active': {
                                                backgroundColor: theme.palette.primary.dark,
                                                color: theme.palette.primary.contrastText,
                                            },
                                        }}
                                    >
                                        {pathAndTitle[path].label}
                                    </Button>
                                ))}
                                <Button onClick={handleLogout} color="inherit" component={Link} to="/login">
                                    Log Out
                                </Button>
                            </ButtonGroup>
                            <Typography sx={{m: 2}}> Logged as {auth?.displayName} ({auth?.email})</Typography>
                        </>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;
