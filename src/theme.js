
export const KEY = 'theme';
export const Theme = { Dark: 'dark', Light: 'light' };

export const isDark = theme => theme === Theme.Dark;

export function switchTheme() {
    const oldTheme = localStorage.getItem(KEY);
    const newTheme = isDark(oldTheme) ? Theme.Light : Theme.Dark;
    localStorage.setItem(KEY, newTheme);
}

export function currentTheme() {
    let theme = localStorage.getItem(KEY);
    if (!theme) {
        theme = Theme.Dark;
        localStorage.setItem(KEY, theme);
    }
    return theme;
}