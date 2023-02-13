
export const KEY = 'theme';
export const Theme = { Dark: 'dark', Light: 'light' };

export const isDark = theme => theme === Theme.Dark;

export function switchTheme() {
    const prevTheme = localStorage.getItem(KEY);
    const nextTheme = isDark(prevTheme) ? Theme.Light : Theme.Dark;
    localStorage.setItem(KEY, nextTheme);
}

export function currentTheme() {
    let theme = localStorage.getItem(KEY);
    if (!theme) {
        theme = Theme.Dark;
        localStorage.setItem(KEY, theme);
    }
    return theme;
}