package lk.vera.app;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int CLEAR_IMMERSIVE_DELAY_MS = 100;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Forcefully clear immersive mode flags that splash screen sets
        clearImmersiveMode();

        // Enable edge-to-edge but respect system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Clear any fullscreen flags
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);

        // Ensure system bars are visible and not overlaying
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.show(WindowInsets.Type.statusBars());
                controller.show(WindowInsets.Type.navigationBars());
                // Prevent immersive mode
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_DEFAULT
                );
            }
        } else {
            View decorView = getWindow().getDecorView();
            int uiVisibility = View.SYSTEM_UI_FLAG_VISIBLE;
            decorView.setSystemUiVisibility(uiVisibility);
        }

        // Adjust WebView settings to ignore system font scaling
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setTextZoom(100); // Set a fixed text zoom level (100%)

        // Clear immersive mode again after a delay (splash screen may set it again)
        new Handler(Looper.getMainLooper()).postDelayed(this::clearImmersiveMode, CLEAR_IMMERSIVE_DELAY_MS);
    }

    @Override
    public void onResume() {
        super.onResume();

        // Aggressively re-apply settings in case they were changed
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        clearImmersiveMode();

        // Ensure system bars are visible
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.show(WindowInsets.Type.statusBars());
                controller.show(WindowInsets.Type.navigationBars());
            }
        } else {
            View decorView = getWindow().getDecorView();
            decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        
        if (hasFocus) {
            // Clear immersive mode when window gains focus
            clearImmersiveMode();
            
            // Ensure system bars are visible
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.show(WindowInsets.Type.statusBars());
                    controller.show(WindowInsets.Type.navigationBars());
                }
            } else {
                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
            }
        }
    }

    /**
     * Aggressively clears all immersive mode flags
     */
    private void clearImmersiveMode() {
        View decorView = getWindow().getDecorView();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Show all system bars
                controller.show(WindowInsets.Type.statusBars());
                controller.show(WindowInsets.Type.navigationBars());
                // Use default behavior (no immersive)
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_DEFAULT
                );
            }
        } else {
            // For older Android versions, clear all immersive flags
            int flags = decorView.getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_FULLSCREEN;
            flags &= ~View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;
            flags &= ~View.SYSTEM_UI_FLAG_IMMERSIVE;
            flags &= ~View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            flags &= ~View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            flags |= View.SYSTEM_UI_FLAG_VISIBLE;
            decorView.setSystemUiVisibility(flags);
        }
    }
}
